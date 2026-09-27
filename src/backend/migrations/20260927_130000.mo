import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type OrderId = Nat;
  type Timestamp = Int;
  type RepairCode = Text;
  type Phone = Text;
  type FileId = Text;

  type RepairStatus = {
    #Recibido;
    #Diagnosticando;
    #EnReparacion;
    #Probando;
    #ListoParaEntregar;
    #Entregado;
  };

  type Client = {
    id : OrderId;
    fullName : Text;
    phone : Phone;
    email : ?Text;
    dni : Text;
    createdAt : Timestamp;
  };

  type Device = {
    id : OrderId;
    brand : Text;
    model : Text;
    imei : ?Text;
    physicalCondition : Text;
  };

  type RepairOrder = {
    id : OrderId;
    code : RepairCode;
    clientId : OrderId;
    deviceId : OrderId;
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
    dniPhotoFileId : ?FileId;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    clients : Map.Map<OrderId, Client>;
    devices : Map.Map<OrderId, Device>;
    orders : Map.Map<OrderId, RepairOrder>;
    counters : { var nextClientId : Nat; var nextDeviceId : Nat; var nextOrderId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      clients = Map.empty();
      devices = Map.empty();
      orders = Map.empty();
      counters = { var nextClientId = 0; var nextDeviceId = 0; var nextOrderId = 0 };
    };
  };
};
