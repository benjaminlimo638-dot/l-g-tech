import Char "mo:core/Char";
import Time "mo:core/Time";
import Types "../types/repair-orders";

module {
  // Unambiguous alphabet: no 0/O/1/I/L to keep codes easy to read aloud.
  let codeAlphabet : [Char] = [
    '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];

  /// Generate a unique, human-readable repair code (format "LG-XXXXXX").
  /// Entropy comes from the current time in nanoseconds mixed with the
  /// caller-supplied unique order id so two calls in the same nanosecond
  /// still differ.
  public func generateCode(orderId : Nat) : Types.RepairCode {
    var seed = Time.now().toNat() + (orderId + 1) * 2654435761;
    var body = "";
    var i = 0;
    while (i < 6) {
      let idx = seed % codeAlphabet.size();
      body := body # codeAlphabet[idx].toText();
      seed := seed / codeAlphabet.size() + 7;
      i += 1;
    };
    "LG-" # body;
  };

  /// Compute the outstanding balance = totalPrice - deposit (never negative).
  public func computeBalance(totalPrice : Nat, deposit : Nat) : Nat {
    if (deposit >= totalPrice) { 0 } else { totalPrice - deposit };
  };

  /// True when `value` looks like an email address (contains an "@").
  public func looksLikeEmail(value : Text) : Bool {
    value.contains(#text "@");
  };

  /// Build the public projection of an order for customer lookup.
  public func toPublicView(order : Types.RepairOrder, client : Types.Client, device : Types.Device) : Types.PublicRepairView {
    {
      code = order.code;
      fullName = client.fullName;
      brand = device.brand;
      model = device.model;
      reportedIssue = order.reportedIssue;
      diagnosis = order.diagnosis;
      totalPrice = order.totalPrice;
      deposit = order.deposit;
      balance = order.balance;
      estimatedTime = order.estimatedTime;
      intakeDate = order.intakeDate;
      estimatedDeliveryDate = order.estimatedDeliveryDate;
      damagePhotoFileIds = order.damagePhotoFileIds;
      devicePhotoFileIds = order.devicePhotoFileIds;
      observations = order.observations;
      status = order.status;
    };
  };

  /// Build the admin projection of an order.
  public func toAdminView(order : Types.RepairOrder, client : Types.Client, device : Types.Device) : Types.AdminRepairView {
    {
      id = order.id;
      code = order.code;
      client;
      device;
      reportedIssue = order.reportedIssue;
      additionalDescription = order.additionalDescription;
      diagnosis = order.diagnosis;
      totalPrice = order.totalPrice;
      deposit = order.deposit;
      balance = order.balance;
      estimatedTime = order.estimatedTime;
      intakeDate = order.intakeDate;
      estimatedDeliveryDate = order.estimatedDeliveryDate;
      deliveredAt = order.deliveredAt;
      observations = order.observations;
      status = order.status;
      damagePhotoFileIds = order.damagePhotoFileIds;
      devicePhotoFileIds = order.devicePhotoFileIds;
      hasDniPhoto = order.dniPhotoFileId != null;
      createdAt = order.createdAt;
      updatedAt = order.updatedAt;
    };
  };

  /// True when the given status is one of the completed stages.
  public func isCompleted(status : Types.RepairStatus) : Bool {
    switch (status) {
      case (#Entregado) { true };
      case (_) { false };
    };
  };

  /// Human-readable Spanish label for a status (used in notifications).
  public func statusLabel(status : Types.RepairStatus) : Text {
    switch (status) {
      case (#Recibido) { "Recibido" };
      case (#Diagnosticando) { "Diagnosticando" };
      case (#EnReparacion) { "En reparación" };
      case (#Probando) { "Probando" };
      case (#ListoParaEntregar) { "Listo para entregar" };
      case (#Entregado) { "Entregado" };
    };
  };
};
