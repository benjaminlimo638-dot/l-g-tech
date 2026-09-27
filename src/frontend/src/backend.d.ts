import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AdminRepairView {
    id: OrderId;
    status: RepairStatus;
    devicePhotoFileIds: Array<FileId>;
    client: Client;
    additionalDescription: string;
    deliveredAt?: Timestamp;
    balance: bigint;
    code: RepairCode;
    createdAt: Timestamp;
    intakeDate: Timestamp;
    reportedIssue: string;
    hasDniPhoto: boolean;
    estimatedDeliveryDate?: Timestamp;
    damagePhotoFileIds: Array<FileId>;
    deposit: bigint;
    diagnosis: string;
    device: Device;
    updatedAt: Timestamp;
    totalPrice: bigint;
    estimatedTime: string;
    observations: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Client {
    id: OrderId;
    dni: string;
    createdAt: Timestamp;
    fullName: string;
    email?: string;
    phone: Phone;
}
export interface Device {
    id: OrderId;
    model: string;
    imei?: string;
    physicalCondition: string;
    brand: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type FileId = string;
export interface IntakeInput {
    dni: string;
    devicePhotoFileIds: Array<FileId>;
    model: string;
    imei?: string;
    reportedIssue: string;
    fullName: string;
    deposit: bigint;
    email?: string;
    dniPhotoFileId?: FileId;
    physicalCondition: string;
    brand: string;
    phone: Phone;
    totalPrice: bigint;
}
export type LookupResult = {
    __kind__: "found";
    found: PublicRepairView;
} | {
    __kind__: "notFound";
    notFound: null;
};
export type OrderId = bigint;
export type Phone = string;
export interface PublicRepairView {
    status: RepairStatus;
    devicePhotoFileIds: Array<FileId>;
    model: string;
    balance: bigint;
    code: RepairCode;
    intakeDate: Timestamp;
    reportedIssue: string;
    estimatedDeliveryDate?: Timestamp;
    fullName: string;
    damagePhotoFileIds: Array<FileId>;
    deposit: bigint;
    diagnosis: string;
    brand: string;
    totalPrice: bigint;
    estimatedTime: string;
    observations: string;
}
export type RepairCode = string;
export interface RepairOrderUpdate {
    estimatedDeliveryDate?: Timestamp;
    deposit?: bigint;
    diagnosis?: string;
    totalPrice?: bigint;
    estimatedTime?: string;
    observations?: string;
}
export interface RepairRequestInput {
    additionalDescription: string;
    model: string;
    reportedIssue: string;
    fullName: string;
    damagePhotoFileIds: Array<FileId>;
    email?: string;
    brand: string;
    phone: Phone;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type StatusChangeResult = {
    __kind__: "ok";
    ok: {
        order: AdminRepairView;
        notificationSent: boolean;
    };
} | {
    __kind__: "notFound";
    notFound: null;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum RepairStatus {
    Recibido = "Recibido",
    Entregado = "Entregado",
    EnReparacion = "EnReparacion",
    Probando = "Probando",
    ListoParaEntregar = "ListoParaEntregar",
    Diagnosticando = "Diagnosticando"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Attach additional photos to an order. Admin only.
     */
    addOrderPhotos(id: OrderId, damagePhotoFileIds: Array<FileId>, devicePhotoFileIds: Array<FileId>): Promise<AdminRepairView>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Change the status of an order. When `notify` is true, sends an email to the
     * / client with the repair code and the new status. Admin only.
     */
    changeRepairStatus(id: OrderId, status: RepairStatus, notify: boolean): Promise<StatusChangeResult>;
    /**
     * / Create a repair order from an admin intake (reception) form. Admin only.
     */
    createRepairOrder(input: IntakeInput): Promise<AdminRepairView>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Static Markdown documentation of the public backend API.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Retrieve the PRIVATE DNI photo file id for an order. Admin only; never
     * / exposed through any public/customer endpoint.
     */
    getDniPhoto(id: OrderId): Promise<FileId | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List all completed (delivered) orders. Admin only.
     */
    listCompletedRepairs(): Promise<Array<AdminRepairView>>;
    /**
     * / List all orders still in progress (not yet delivered). Admin only.
     */
    listPendingRepairs(): Promise<Array<AdminRepairView>>;
    /**
     * / Look up a single repair by code and/or phone. Returns only that order's
     * / public fields; never exposes the DNI photo or other customers' orders.
     * / When both a code and a phone are supplied, the order must match BOTH:
     * / a valid code with a mismatched phone yields #notFound.
     */
    lookupRepair(code: RepairCode | null, phone: Phone | null): Promise<LookupResult>;
    /**
     * / Register a new client. Admin only.
     */
    registerClient(fullName: string, phone: Phone, dni: string): Promise<Client>;
    /**
     * / Register a new device. Admin only.
     */
    registerDevice(brand: string, model: string, imei: string | null, physicalCondition: string): Promise<Device>;
    schema(): Promise<string>;
    /**
     * / Search orders by name, phone, code or model. Admin only.
     */
    searchRepairs(term: string): Promise<Array<AdminRepairView>>;
    /**
     * / Submit a repair request from the customer app. Creates the client (if new),
     * / the device, and the order, and returns the generated repair code.
     */
    submitRepairRequest(input: RepairRequestInput): Promise<RepairCode>;
    /**
     * / Update an existing order's diagnosis, price, deposit, estimate, delivery
     * / date and observations. Balance is recomputed automatically. Admin only.
     */
    updateRepairOrder(id: OrderId, update: RepairOrderUpdate): Promise<AdminRepairView>;
}
