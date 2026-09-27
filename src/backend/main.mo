import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import RepairOrdersApi "mixins/repair-orders-api";
import ApiDocMixin "mixins/api-doc";
import RepairOrdersLib "lib/repair-orders";
import Types "types/repair-orders";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let clients : Map.Map<Types.OrderId, Types.Client>;
  let devices : Map.Map<Types.OrderId, Types.Device>;
  let orders : Map.Map<Types.OrderId, Types.RepairOrder>;
  let counters : { var nextClientId : Nat; var nextDeviceId : Nat; var nextOrderId : Nat };

  include RepairOrdersApi(accessControlState, clients, devices, orders, counters);
  include ApiDocMixin();

  include Expose({
    entities = [
      clients.toEntityManual("client", "Client", "id")
        .sample({
          id = 0;
          fullName = "";
          phone = "";
          email = null;
          dni = "";
          createdAt = 0;
        })
        .payload("fullName", func c = c.fullName)
        .payload("phone", func c = c.phone)
        .payload("email", func c = c.email ?? "")
        .payload("createdAt", func c = c.createdAt)
        .controllerOnly()
        .build(),
      devices.toEntityManual("device", "Device", "id")
        .sample({
          id = 0;
          brand = "";
          model = "";
          imei = null;
          physicalCondition = "";
        })
        .payload("brand", func d = d.brand)
        .payload("model", func d = d.model)
        .payload("imei", func d = d.imei ?? "")
        .payload("physicalCondition", func d = d.physicalCondition)
        .controllerOnly()
        .build(),
      orders.toEntityManual("repairOrder", "RepairOrder", "id")
        .sample({
          id = 0;
          code = "LG-000000";
          clientId = 0;
          deviceId = 0;
          reportedIssue = "";
          additionalDescription = "";
          diagnosis = "";
          totalPrice = 0;
          deposit = 0;
          balance = 0;
          estimatedTime = "";
          intakeDate = 0;
          estimatedDeliveryDate = null;
          deliveredAt = null;
          observations = "";
          status = #Recibido;
          damagePhotoFileIds = [];
          devicePhotoFileIds = [];
          dniPhotoFileId = null;
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("code", func o = o.code)
        .payload("clientId", func o = o.clientId)
        .payload("deviceId", func o = o.deviceId)
        .payload("reportedIssue", func o = o.reportedIssue)
        .payload("diagnosis", func o = o.diagnosis)
        .payload("totalPrice", func o = o.totalPrice)
        .payload("deposit", func o = o.deposit)
        .payload("balance", func o = o.balance)
        .payload("estimatedTime", func o = o.estimatedTime)
        .payload("intakeDate", func o = o.intakeDate)
        .payload("observations", func o = o.observations)
        .payload("status", func o = RepairOrdersLib.statusLabel(o.status))
        .payload("createdAt", func o = o.createdAt)
        .payload("updatedAt", func o = o.updatedAt)
        .controllerOnly()
        .build(),
    ];
  });
};
