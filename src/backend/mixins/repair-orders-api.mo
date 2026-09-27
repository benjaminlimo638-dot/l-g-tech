import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import EmailClient "mo:caffeineai-email/emailClient";
import RepairOrdersLib "../lib/repair-orders";
import Types "../types/repair-orders";

mixin (
  accessControlState : AccessControl.AccessControlState,
  clients : Map.Map<Types.OrderId, Types.Client>,
  devices : Map.Map<Types.OrderId, Types.Device>,
  orders : Map.Map<Types.OrderId, Types.RepairOrder>,
  counters : { var nextClientId : Nat; var nextDeviceId : Nat; var nextOrderId : Nat },
) {
  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  // Safe admin check: never traps. Anonymous callers and principals that were
  // never registered are simply not admins. `AccessControl.isAdmin` delegates to
  // `getUserRole`, which traps with "User is not registered" for an unregistered
  // non-anonymous caller — using it directly would surface that internal message
  // instead of a consistent authorization rejection.
  func isRegisteredAdmin(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (?#admin) { true };
      case (_) { false };
    };
  };

  func requireAdmin(caller : Principal) {
    if (not isRegisteredAdmin(caller)) {
      Runtime.trap("No autorizado: solo administradores");
    };
  };

  func findOrderByCode(code : Types.RepairCode) : ?Types.RepairOrder {
    orders.values().find(func o = o.code == code);
  };

  func findOrderByPhone(phone : Types.Phone) : ?Types.RepairOrder {
    // Most recent order for that phone wins, so a returning customer sees
    // their latest repair.
    var best : ?Types.RepairOrder = null;
    for (order in orders.values()) {
      if (clientPhone(order) == phone) {
        switch (best) {
          case null { best := ?order };
          case (?current) {
            if (order.createdAt > current.createdAt) { best := ?order };
          };
        };
      };
    };
    best;
  };

  func clientPhone(order : Types.RepairOrder) : Types.Phone {
    switch (clients.get(order.clientId)) {
      case (?c) { c.phone };
      case null { "" };
    };
  };

  func findClientByPhone(phone : Types.Phone) : ?Types.Client {
    clients.values().find(func c = c.phone == phone);
  };

  // The notification address is the client's stored email when present;
  // otherwise the stored phone is used only if it looks like an email address.
  // When neither yields an address the send is skipped and reported as not sent.
  func clientEmail(order : Types.RepairOrder) : Text {
    switch (clients.get(order.clientId)) {
      case (?client) {
        switch (client.email) {
          case (?email) { email };
          case null {
            if (RepairOrdersLib.looksLikeEmail(client.phone)) { client.phone } else { "" };
          };
        };
      };
      case null { "" };
    };
  };

  func adminViewOf(order : Types.RepairOrder) : ?Types.AdminRepairView {
    switch (clients.get(order.clientId), devices.get(order.deviceId)) {
      case (?client, ?device) { ?RepairOrdersLib.toAdminView(order, client, device) };
      case (_) { null };
    };
  };

  func requireAdminView(order : Types.RepairOrder) : Types.AdminRepairView {
    adminViewOf(order) ?? Runtime.trap("Orden inconsistente: cliente o equipo ausente");
  };

  func matchesTerm(order : Types.RepairOrder, term : Text) : Bool {
    let needle = term.toLower();
    let clientName = switch (clients.get(order.clientId)) {
      case (?c) { c.fullName.toLower() };
      case null { "" };
    };
    let clientPhoneText = clientPhone(order).toLower();
    let deviceModel = switch (devices.get(order.deviceId)) {
      case (?d) { d.model.toLower() };
      case null { "" };
    };
    clientName.contains(#text needle)
      or clientPhoneText.contains(#text needle)
      or order.code.toLower().contains(#text needle)
      or deviceModel.contains(#text needle);
  };

  // ---------------------------------------------------------------------------
  // Public / customer endpoints
  // ---------------------------------------------------------------------------

  /// Submit a repair request from the customer app. Creates the client (if new),
  /// the device, and the order, and returns the generated repair code.
  public shared ({ caller }) func submitRepairRequest(input : Types.RepairRequestInput) : async Types.RepairCode {
    ignore caller;
    let now = Time.now();

    // Reuse an existing client with the same phone; otherwise create one.
    let clientId = switch (findClientByPhone(input.phone)) {
      case (?existing) { existing.id };
      case null {
        let id = counters.nextClientId;
        counters.nextClientId += 1;
        clients.add(id, {
          id;
          fullName = input.fullName;
          phone = input.phone;
          email = input.email;
          dni = "";
          createdAt = now;
        });
        id;
      };
    };

    let deviceId = counters.nextDeviceId;
    counters.nextDeviceId += 1;
    devices.add(deviceId, {
      id = deviceId;
      brand = input.brand;
      model = input.model;
      imei = null;
      physicalCondition = "";
    });

    let orderId = counters.nextOrderId;
    counters.nextOrderId += 1;

    let code = RepairOrdersLib.generateCode(orderId);
    let order : Types.RepairOrder = {
      id = orderId;
      code;
      clientId;
      deviceId;
      reportedIssue = input.reportedIssue;
      additionalDescription = input.additionalDescription;
      diagnosis = "";
      totalPrice = 0;
      deposit = 0;
      balance = 0;
      estimatedTime = "";
      intakeDate = now;
      estimatedDeliveryDate = null;
      deliveredAt = null;
      observations = "";
      status = #Recibido;
      damagePhotoFileIds = input.damagePhotoFileIds;
      devicePhotoFileIds = [];
      dniPhotoFileId = null;
      createdAt = now;
      updatedAt = now;
    };
    orders.add(orderId, order);
    code;
  };

  /// Look up a single repair by code and/or phone. Returns only that order's
  /// public fields; never exposes the DNI photo or other customers' orders.
  /// When both a code and a phone are supplied, the order must match BOTH:
  /// a valid code with a mismatched phone yields #notFound.
  public query func lookupRepair(code : ?Types.RepairCode, phone : ?Types.Phone) : async Types.LookupResult {
    let found : ?Types.RepairOrder = switch (code, phone) {
      case (?c, ?p) {
        switch (findOrderByCode(c)) {
          case (?order) { if (clientPhone(order) == p) { ?order } else { null } };
          case null { null };
        };
      };
      case (?c, null) { findOrderByCode(c) };
      case (null, ?p) { findOrderByPhone(p) };
      case (null, null) { null };
    };
    switch (found) {
      case (?order) {
        switch (clients.get(order.clientId), devices.get(order.deviceId)) {
          case (?client, ?device) { #found(RepairOrdersLib.toPublicView(order, client, device)) };
          case (_) { #notFound };
        };
      };
      case null { #notFound };
    };
  };

  // ---------------------------------------------------------------------------
  // Admin-only endpoints
  // ---------------------------------------------------------------------------

  /// Register a new client. Admin only.
  public shared ({ caller }) func registerClient(fullName : Text, phone : Types.Phone, dni : Text) : async Types.Client {
    requireAdmin(caller);
    let id = counters.nextClientId;
    counters.nextClientId += 1;
    let client : Types.Client = {
      id;
      fullName;
      phone;
      email = null;
      dni;
      createdAt = Time.now();
    };
    clients.add(id, client);
    client;
  };

  /// Register a new device. Admin only.
  public shared ({ caller }) func registerDevice(brand : Text, model : Text, imei : ?Text, physicalCondition : Text) : async Types.Device {
    requireAdmin(caller);
    let id = counters.nextDeviceId;
    counters.nextDeviceId += 1;
    let device : Types.Device = { id; brand; model; imei; physicalCondition };
    devices.add(id, device);
    device;
  };

  /// Create a repair order from an admin intake (reception) form. Admin only.
  public shared ({ caller }) func createRepairOrder(input : Types.IntakeInput) : async Types.AdminRepairView {
    requireAdmin(caller);
    let now = Time.now();
    let clientId = counters.nextClientId;
    counters.nextClientId += 1;
    let deviceId = counters.nextDeviceId;
    counters.nextDeviceId += 1;
    let orderId = counters.nextOrderId;
    counters.nextOrderId += 1;

    let client : Types.Client = {
      id = clientId;
      fullName = input.fullName;
      phone = input.phone;
      email = input.email;
      dni = input.dni;
      createdAt = now;
    };
    clients.add(clientId, client);

    let device : Types.Device = {
      id = deviceId;
      brand = input.brand;
      model = input.model;
      imei = input.imei;
      physicalCondition = input.physicalCondition;
    };
    devices.add(deviceId, device);

    let order : Types.RepairOrder = {
      id = orderId;
      code = RepairOrdersLib.generateCode(orderId);
      clientId;
      deviceId;
      reportedIssue = input.reportedIssue;
      additionalDescription = "";
      diagnosis = "";
      totalPrice = input.totalPrice;
      deposit = input.deposit;
      balance = RepairOrdersLib.computeBalance(input.totalPrice, input.deposit);
      estimatedTime = "";
      intakeDate = now;
      estimatedDeliveryDate = null;
      deliveredAt = null;
      observations = "";
      status = #Recibido;
      damagePhotoFileIds = [];
      devicePhotoFileIds = input.devicePhotoFileIds;
      dniPhotoFileId = input.dniPhotoFileId;
      createdAt = now;
      updatedAt = now;
    };
    orders.add(orderId, order);
    RepairOrdersLib.toAdminView(order, client, device);
  };

  /// Update an existing order's diagnosis, price, deposit, estimate, delivery
  /// date and observations. Balance is recomputed automatically. Admin only.
  public shared ({ caller }) func updateRepairOrder(id : Types.OrderId, update : Types.RepairOrderUpdate) : async Types.AdminRepairView {
    requireAdmin(caller);
    let existing = orders.get(id) ?? Runtime.trap("Orden no encontrada");
    let totalPrice = update.totalPrice ?? existing.totalPrice;
    let deposit = update.deposit ?? existing.deposit;
    let estimatedDeliveryDate = switch (update.estimatedDeliveryDate) {
      case (?d) { ?d };
      case null { existing.estimatedDeliveryDate };
    };
    let updated : Types.RepairOrder = {
      existing with
      diagnosis = update.diagnosis ?? existing.diagnosis;
      totalPrice;
      deposit;
      balance = RepairOrdersLib.computeBalance(totalPrice, deposit);
      estimatedTime = update.estimatedTime ?? existing.estimatedTime;
      estimatedDeliveryDate;
      observations = update.observations ?? existing.observations;
      updatedAt = Time.now();
    };
    orders.add(id, updated);
    requireAdminView(updated);
  };

  /// Change the status of an order. When `notify` is true, sends an email to the
  /// client with the repair code and the new status. Admin only.
  public shared ({ caller }) func changeRepairStatus(id : Types.OrderId, status : Types.RepairStatus, notify : Bool) : async Types.StatusChangeResult {
    requireAdmin(caller);
    switch (orders.get(id)) {
      case null { #notFound };
      case (?existing) {
        let now = Time.now();
        let deliveredAt = if (RepairOrdersLib.isCompleted(status)) { ?now } else { existing.deliveredAt };
        let updated : Types.RepairOrder = {
          existing with
          status;
          deliveredAt;
          updatedAt = now;
        };
        orders.add(id, updated);

        var notificationSent = false;
        if (notify) {
          let recipient = clientEmail(updated);
          if (recipient != "") {
            let statusText = RepairOrdersLib.statusLabel(status);
            let subject = "L&G TECH — Actualización de su reparación " # updated.code;
            let body = "Estimado(a) cliente,<br><br>El estado de su reparación <b>" # updated.code # "</b> ha cambiado a: <b>" # statusText # "</b>.<br><br>Puede consultar el detalle en la aplicación con su código de reparación.<br><br>Gracias por confiar en L&G TECH.";
            let result = await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
            switch (result) {
              case (#ok) { notificationSent := true };
              case (#err(_)) { notificationSent := false };
            };
          };
        };
        #ok({ order = requireAdminView(updated); notificationSent });
      };
    };
  };

  /// Attach additional photos to an order. Admin only.
  public shared ({ caller }) func addOrderPhotos(id : Types.OrderId, damagePhotoFileIds : [Types.FileId], devicePhotoFileIds : [Types.FileId]) : async Types.AdminRepairView {
    requireAdmin(caller);
    let existing = orders.get(id) ?? Runtime.trap("Orden no encontrada");
    let updated : Types.RepairOrder = {
      existing with
      damagePhotoFileIds = existing.damagePhotoFileIds.concat(damagePhotoFileIds);
      devicePhotoFileIds = existing.devicePhotoFileIds.concat(devicePhotoFileIds);
      updatedAt = Time.now();
    };
    orders.add(id, updated);
    requireAdminView(updated);
  };

  /// Retrieve the PRIVATE DNI photo file id for an order. Admin only; never
  /// exposed through any public/customer endpoint.
  public query ({ caller }) func getDniPhoto(id : Types.OrderId) : async ?Types.FileId {
    requireAdmin(caller);
    switch (orders.get(id)) {
      case (?order) { order.dniPhotoFileId };
      case null { null };
    };
  };

  /// Search orders by name, phone, code or model. Admin only.
  public query ({ caller }) func searchRepairs(term : Text) : async [Types.AdminRepairView] {
    requireAdmin(caller);
    orders.values()
      .filter(func o = matchesTerm(o, term))
      .map(func o = requireAdminView(o))
      .toArray();
  };

  /// List all orders still in progress (not yet delivered). Admin only.
  public query ({ caller }) func listPendingRepairs() : async [Types.AdminRepairView] {
    requireAdmin(caller);
    orders.values()
      .filter(func o = not RepairOrdersLib.isCompleted(o.status))
      .map(func o = requireAdminView(o))
      .toArray();
  };

  /// List all completed (delivered) orders. Admin only.
  public query ({ caller }) func listCompletedRepairs() : async [Types.AdminRepairView] {
    requireAdmin(caller);
    orders.values()
      .filter(func o = RepairOrdersLib.isCompleted(o.status))
      .map(func o = requireAdminView(o))
      .toArray();
  };
};
