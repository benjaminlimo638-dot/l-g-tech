mixin () {
  /// Static Markdown documentation of the public backend API.
  public query func getApiDoc() : async Text {
    "# L&G TECH — API del backend\n\n" #
    "Backend Motoko del servicio técnico de celulares L&G TECH. Gestiona clientes, equipos y órdenes de reparación, y expone una consulta pública por código o teléfono, un panel administrativo privado y notificaciones por correo.\n\n" #
    "## Autenticación e identidad\n\n" #
    "- Los endpoints de cliente (`submitRepairRequest`, `lookupRepair`) son públicos y no requieren sesión.\n" #
    "- Los endpoints administrativos requieren un principal con rol de administrador. Un llamador anónimo o sin rol recibe el trap `No autorizado: solo administradores`.\n" #
    "- El primer llamador que invoca `_initialize_access_control` (endpoint del componente de autorización) se convierte en administrador; los llamadores posteriores reciben un rol no administrador. Un llamador directo debe registrarse así antes de cualquier llamada protegida, incluidas las consultas.\n" #
    "- El frontend fija un origen de derivación de Internet Identity, publicado en `/.well-known/ii-derivation-origin` cuando está disponible. Un agente que ya tiene la autorización de Internet Identity del usuario deriva el principal correcto contra ese origen (por ejemplo `icp identity link web <name> --app <host>`). Esa delegación actúa con la autoridad completa del usuario en esta aplicación hasta que expire.\n" #
    "- Un principal puede estar sin registrar aunque la aplicación ya lo conozca: el registro ocurre solo cuando el llamador inicia sesión a través del frontend propio, y un principal derivado contra otro origen es distinto del registrado.\n\n" #
    "## Endpoints públicos de cliente\n\n" #
    "- `submitRepairRequest(input : RepairRequestInput) : async RepairCode` — crea (o reutiliza por teléfono) el cliente, el equipo y la orden, y devuelve el código de reparación generado (formato `LG-XXXXXX`). `input.email` es opcional y, si se envía, se usa para notificaciones.\n" #
    "- `lookupRepair(code : ?RepairCode, phone : ?Phone) : async LookupResult` — devuelve únicamente la orden que coincide con el código (prioritario) o con el teléfono (la orden más reciente). Nunca expone la foto del DNI ni órdenes de otros clientes. Devuelve `#found(PublicRepairView)` o `#notFound`.\n\n" #
    "## Endpoints administrativos\n\n" #
    "- `registerClient(fullName, phone, dni) : async Client` — registra un cliente (sin correo).\n" #
    "- `registerDevice(brand, model, imei, physicalCondition) : async Device` — registra un equipo.\n" #
    "- `createRepairOrder(input : IntakeInput) : async AdminRepairView` — crea una orden desde la recepción; `input.email` es opcional; el saldo se calcula como `totalPrice - deposit`.\n" #
    "- `updateRepairOrder(id, update : RepairOrderUpdate) : async AdminRepairView` — actualiza diagnóstico, precio, adelanto, tiempo estimado, fecha estimada de entrega y observaciones; `null` deja el campo sin cambios y el saldo se recalcula.\n" #
    "- `changeRepairStatus(id, status, notify) : async StatusChangeResult` — cambia el estado; si `notify` es verdadero envía un correo al cliente con el código y el nuevo estado. Devuelve `#ok({ order; notificationSent })` o `#notFound`.\n" #
    "- `addOrderPhotos(id, damagePhotoFileIds, devicePhotoFileIds) : async AdminRepairView` — adjunta fotos a la orden.\n" #
    "- `getDniPhoto(id) : async ?FileId` — devuelve el id de la foto PRIVADA del DNI. Solo administradores; nunca se expone en la consulta pública.\n" #
    "- `searchRepairs(term) : async [AdminRepairView]` — busca por nombre, teléfono, código o modelo.\n" #
    "- `listPendingRepairs() : async [AdminRepairView]` — órdenes no entregadas.\n" #
    "- `listCompletedRepairs() : async [AdminRepairView]` — órdenes entregadas.\n\n" #
    "## Unidades y codificación\n\n" #
    "- `Timestamp` es `Int` en nanosegundos desde la época (`Time.now()`).\n" #
    "- `OrderId` es `Nat` secuencial interno; `RepairCode` es `Text` legible; `Phone` es `Text`; `FileId` es `Text` (identificador de object storage).\n" #
    "- `RepairStatus` es una variante: `#Recibido`, `#Diagnosticando`, `#EnReparacion`, `#Probando`, `#ListoParaEntregar`, `#Entregado`.\n" #
    "- Los campos opcionales (`?T`) usan `null` para ausencia; `email` es `?Text`.\n\n" #
    "## Ciclo de vida y sondeo\n\n" #
    "- El estado avanza por la línea `Recibido → Diagnosticando → En reparación → Probando → Listo para entregar → Entregado`.\n" #
    "- Al pasar a `#Entregado` se registra `deliveredAt`; en estados anteriores se conserva el valor previo.\n" #
    "- El cliente puede sondear `lookupRepair` con su código o teléfono; la consulta es de solo lectura y segura de repetir.\n\n" #
    "## Reintentos e idempotencia\n\n" #
    "- `submitRepairRequest` NO es idempotente: cada llamada crea una nueva orden y un nuevo código. Reintentar tras un error de red puede duplicar la solicitud.\n" #
    "- `changeRepairStatus` y `updateRepairOrder` son idempotentes respecto al estado final: repetir con los mismos argumentos deja el mismo resultado. `changeRepairStatus` con `notify = true` puede reenviar el correo en cada llamada.\n" #
    "- `addOrderPhotos` es acumulativo: repetir la llamada duplica los ids de foto.\n\n" #
    "## Errores y límites\n\n" #
    "- Los endpoints administrativos hacen trap con `No autorizado: solo administradores` si el llamador no es administrador.\n" #
    "- `updateRepairOrder` y `addOrderPhotos` hacen trap con `Orden no encontrada` si el id no existe.\n" #
    "- `changeRepairStatus` devuelve `#notFound` en lugar de hacer trap cuando la orden no existe.\n" #
    "- La notificación por correo solo se envía cuando el cliente tiene un correo almacenado, o cuando su teléfono contiene `@`; en caso contrario `notificationSent` es `false`.\n" #
    "- La foto del DNI es privada: solo `getDniPhoto` (administrador) la devuelve; `lookupRepair` nunca la incluye.\n";
  };
};
