import Common "common";

module {
  public type Timestamp = Common.Timestamp;
  public type OrderId = Common.OrderId;
  public type RepairCode = Common.RepairCode;
  public type Phone = Common.Phone;
  public type FileId = Common.FileId;

  /// The six-stage repair workflow, in order.
  public type RepairStatus = {
    #Recibido;
    #Diagnosticando;
    #EnReparacion;
    #Probando;
    #ListoParaEntregar;
    #Entregado;
  };

  /// A registered customer of the shop. `email` is optional and, when present,
  /// is the address used for repair-status notifications.
  public type Client = {
    id : OrderId;
    fullName : Text;
    phone : Phone;
    email : ?Text;
    dni : Text;
    createdAt : Timestamp;
  };

  /// A device received for repair.
  public type Device = {
    id : OrderId;
    brand : Text;
    model : Text;
    imei : ?Text;
    physicalCondition : Text;
  };

  /// A repair order. `dniPhotoFileId` is PRIVATE: it is never returned by any
  /// public/customer endpoint, only by the admin-only DNI photo endpoint.
  public type RepairOrder = {
    id : OrderId;
    code : RepairCode;
    clientId : OrderId;
    deviceId : OrderId;
    reportedIssue : Text;
    additionalDescription : Text;
    diagnosis : Text;
    totalPrice : Nat;
    deposit : Nat;
    balance : Nat; // auto-computed = totalPrice - deposit
    estimatedTime : Text;
    intakeDate : Timestamp;
    estimatedDeliveryDate : ?Timestamp;
    deliveredAt : ?Timestamp;
    observations : Text;
    status : RepairStatus;
    damagePhotoFileIds : [FileId];
    devicePhotoFileIds : [FileId];
    dniPhotoFileId : ?FileId; // PRIVATE — admin only
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Public projection returned to a customer lookup. Excludes the DNI photo
  /// and any internal identifiers.
  public type PublicRepairView = {
    code : RepairCode;
    fullName : Text;
    brand : Text;
    model : Text;
    reportedIssue : Text;
    diagnosis : Text;
    totalPrice : Nat;
    deposit : Nat;
    balance : Nat;
    estimatedTime : Text;
    intakeDate : Timestamp;
    estimatedDeliveryDate : ?Timestamp;
    damagePhotoFileIds : [FileId];
    devicePhotoFileIds : [FileId];
    observations : Text;
    status : RepairStatus;
  };

  /// Admin projection: full order plus resolved client/device fields.
  public type AdminRepairView = {
    id : OrderId;
    code : RepairCode;
    client : Client;
    device : Device;
    reportedIssue : Text;
    additionalDescription : Text;
    diagnosis : Text;
    totalPrice : Nat;
    deposit : Nat;
    balance : Nat;
    estimatedTime : Text;
    intakeDate : Timestamp;
    estimatedDeliveryDate : ?Timestamp;
    deliveredAt : ?Timestamp;
    observations : Text;
    status : RepairStatus;
    damagePhotoFileIds : [FileId];
    devicePhotoFileIds : [FileId];
    hasDniPhoto : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Input for a customer-submitted repair request.
  public type RepairRequestInput = {
    fullName : Text;
    phone : Phone;
    email : ?Text;
    brand : Text;
    model : Text;
    reportedIssue : Text;
    additionalDescription : Text;
    damagePhotoFileIds : [FileId];
  };

  /// Input for an admin-created intake (reception) of a device.
  public type IntakeInput = {
    fullName : Text;
    dni : Text;
    dniPhotoFileId : ?FileId;
    phone : Phone;
    email : ?Text;
    brand : Text;
    model : Text;
    imei : ?Text;
    reportedIssue : Text;
    physicalCondition : Text;
    devicePhotoFileIds : [FileId];
    totalPrice : Nat;
    deposit : Nat;
  };

  /// Admin update payload for an existing order. `null` leaves a field unchanged.
  public type RepairOrderUpdate = {
    diagnosis : ?Text;
    totalPrice : ?Nat;
    deposit : ?Nat;
    estimatedTime : ?Text;
    estimatedDeliveryDate : ?Timestamp;
    observations : ?Text;
  };

  /// Result of a customer lookup: the matching public order, if any.
  public type LookupResult = {
    #found : PublicRepairView;
    #notFound;
  };

  /// Result of a status change, reporting whether a notification was sent.
  public type StatusChangeResult = {
    #ok : { order : AdminRepairView; notificationSent : Bool };
    #notFound;
  };

  /// Errors surfaced by admin mutations.
  public type RepairError = {
    #notFound;
    #notAuthorized;
    #invalidInput : Text;
  };
};
