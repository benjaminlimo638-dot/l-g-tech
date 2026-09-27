import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend lane: drives the real canister on the platform's PocketIC sidecar.
 *
 * The raw `@dfinity/pic` actor speaks Candid, so results arrive in their
 * Candid-native shape (`{ found: ... }`, `{ Recibido: null }`) — NOT the
 * `__kind__`-tagged shape the generated frontend `Backend` class produces.
 * Assertions here must use the Candid shape.
 *
 * Authorization: `_initialize_access_control` grants the administrator role to
 * its caller, but `AccessControl.initialize` returns early for the anonymous
 * principal. A `setupCanister` with no `sender` installs and calls as
 * `Principal.anonymous()`, so the initialization is a no-op and every admin-only
 * method traps with "No autorizado: solo administradores". The canister is
 * therefore installed with a deterministic non-anonymous identity, which is the
 * caller that becomes admin.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

/** Deterministic admin identity: the first non-anonymous caller of the canister. */
const admin = createIdentity("lg-tech-admin");

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
    sender: admin.getPrincipal(),
  }));
  // The first non-anonymous caller of `_initialize_access_control` becomes the
  // administrator. Every admin-only method below traps until this runs.
  actor.setIdentity(admin);
  await actor._initialize_access_control();
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listPendingRepairs()).resolves.toEqual([]);
  await expect(actor.listCompletedRepairs()).resolves.toEqual([]);
  await expect(actor.searchRepairs("nadie")).resolves.toEqual([]);
});

it("round-trips a customer repair request through the real canister", async () => {
  const code = await actor.submitRepairRequest({
    fullName: "María González",
    phone: "+34 600 123 456",
    email: ["maria@example.com"],
    brand: "Samsung",
    model: "Galaxy S23",
    reportedIssue: "Pantalla rota",
    additionalDescription: "Se cayó ayer",
    damagePhotoFileIds: ["hash-damage-1"],
  });

  expect(typeof code).toBe("string");
  expect(code.startsWith("LG-")).toBe(true);

  const lookup = await actor.lookupRepair([code], []);
  expect(lookup).toHaveProperty("found");
  if (!("found" in lookup)) throw new Error("expected found");
  expect(lookup.found.code).toBe(code);
  expect(lookup.found.fullName).toBe("María González");
  expect(lookup.found.brand).toBe("Samsung");
  expect(lookup.found.model).toBe("Galaxy S23");
  expect(lookup.found.status).toEqual({ Recibido: null });
  expect(lookup.found.damagePhotoFileIds).toEqual(["hash-damage-1"]);
});

it("returns notFound for an unknown code or phone without leaking data", async () => {
  await expect(actor.lookupRepair(["LG-NOPE00"], [])).resolves.toEqual({
    notFound: null,
  });
  await expect(actor.lookupRepair([], ["+34 000 000 000"])).resolves.toEqual({
    notFound: null,
  });
});

it("requires both code and phone to match when both are supplied", async () => {
  const code = await actor.submitRepairRequest({
    fullName: "Sofía Ramírez",
    phone: "+34 655 666 777",
    email: [],
    brand: "Oppo",
    model: "Find X6",
    reportedIssue: "Cámara borrosa",
    additionalDescription: "",
    damagePhotoFileIds: [],
  });

  // The matching pair resolves to the order.
  const matched = await actor.lookupRepair([code], ["+34 655 666 777"]);
  expect(matched).toHaveProperty("found");
  if (!("found" in matched)) throw new Error("expected found");
  expect(matched.found.code).toBe(code);

  // A valid code with a mismatched phone must not leak the order.
  await expect(
    actor.lookupRepair([code], ["+34 999 999 999"]),
  ).resolves.toEqual({ notFound: null });
});

it("computes the outstanding balance on an admin order", async () => {
  const created = await actor.createRepairOrder({
    fullName: "Juan Pérez",
    dni: "12345678A",
    dniPhotoFileId: ["hash-dni-1"],
    phone: "+34 611 222 333",
    email: [],
    brand: "Apple",
    model: "iPhone 13",
    imei: ["123456789012345"],
    reportedIssue: "Batería hinchada",
    physicalCondition: "Marco con golpes leves",
    devicePhotoFileIds: ["hash-device-1"],
    totalPrice: 120n,
    deposit: 50n,
  });

  expect(created.balance).toBe(70n);
  expect(created.hasDniPhoto).toBe(true);
  expect(created.status).toEqual({ Recibido: null });

  const updated = await actor.updateRepairOrder(created.id, {
    diagnosis: ["Cambio de batería"],
    totalPrice: [200n],
    deposit: [80n],
    estimatedTime: ["3 días"],
    estimatedDeliveryDate: [],
    observations: ["Repuesto pedido"],
  });
  expect(updated.balance).toBe(120n);
  expect(updated.diagnosis).toBe("Cambio de batería");
});

it("changes status and reflects it in the public lookup", async () => {
  const code = await actor.submitRepairRequest({
    fullName: "Ana López",
    phone: "+34 622 333 444",
    email: [],
    brand: "Xiaomi",
    model: "Redmi Note 12",
    reportedIssue: "No carga",
    additionalDescription: "",
    damagePhotoFileIds: [],
  });

  const pending = await actor.listPendingRepairs();
  const order = pending.find((o) => o.code === code);
  expect(order).toBeDefined();
  if (order === undefined) throw new Error("order not found");

  const result = await actor.changeRepairStatus(
    order.id,
    { EnReparacion: null },
    false,
  );
  expect(result).toHaveProperty("ok");
  if (!("ok" in result)) throw new Error("expected ok");
  expect(result.ok.order.status).toEqual({ EnReparacion: null });

  const lookup = await actor.lookupRepair([code], []);
  expect(lookup).toHaveProperty("found");
  if (!("found" in lookup)) throw new Error("expected found");
  expect(lookup.found.status).toEqual({ EnReparacion: null });
});

it("keeps the DNI photo out of the public lookup and behind the admin endpoint", async () => {
  const created = await actor.createRepairOrder({
    fullName: "Carlos Ruiz",
    dni: "87654321B",
    dniPhotoFileId: ["hash-dni-private"],
    phone: "+34 633 444 555",
    email: [],
    brand: "Google",
    model: "Pixel 7",
    imei: [],
    reportedIssue: "Micrófono",
    physicalCondition: "",
    devicePhotoFileIds: [],
    totalPrice: 0n,
    deposit: 0n,
  });

  const lookup = await actor.lookupRepair([created.code], []);
  expect(lookup).toHaveProperty("found");
  if (!("found" in lookup)) throw new Error("expected found");
  expect(Object.keys(lookup.found)).not.toContain("dniPhotoFileId");
  // BigInt fields make a bare `JSON.stringify` throw, so serialize with a
  // replacer to scan the whole public payload for the private file id.
  const serialized = JSON.stringify(lookup.found, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  expect(serialized).not.toContain("hash-dni-private");

  await expect(actor.getDniPhoto(created.id)).resolves.toEqual([
    "hash-dni-private",
  ]);
});

it("searches orders by name, phone, code and model", async () => {
  const created = await actor.createRepairOrder({
    fullName: "Lucía Torres",
    dni: "11111111C",
    dniPhotoFileId: [],
    phone: "+34 644 555 666",
    email: [],
    brand: "Motorola",
    model: "Edge 40",
    imei: [],
    reportedIssue: "Altavoz",
    physicalCondition: "",
    devicePhotoFileIds: [],
    totalPrice: 0n,
    deposit: 0n,
  });

  for (const term of ["Lucía", "644 555 666", created.code, "Edge 40"]) {
    const results = await actor.searchRepairs(term);
    expect(results.map((o) => o.code)).toContain(created.code);
  }
});

it("rejects an anonymous caller from admin-only methods", async () => {
  // A freshly created actor calls as the anonymous principal until an identity
  // is set, so this is the unauthenticated visitor the panel must turn away.
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.listPendingRepairs()).rejects.toThrow();
  await expect(guest.getDniPhoto(0n)).rejects.toThrow();
});
