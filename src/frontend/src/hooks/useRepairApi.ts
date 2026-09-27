import { createActor } from "@/backend";
import type {
  AdminRepairView,
  IntakeInput,
  LookupResult,
  OrderId,
  RepairCode,
  RepairOrderUpdate,
  RepairRequestInput,
  RepairStatus,
  StatusChangeResult,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const repairKeys = {
  pending: ["repairs", "pending"] as const,
  completed: ["repairs", "completed"] as const,
  search: (term: string) => ["repairs", "search", term] as const,
  lookup: (code: string | null, phone: string | null) =>
    ["repairs", "lookup", code, phone] as const,
  isAdmin: ["caller", "isAdmin"] as const,
};

/* ------------------------------------------------------------------ */
/* Customer-facing operations                                          */
/* ------------------------------------------------------------------ */

/** Submit a repair request from the customer app. Returns the repair code. */
export function useSubmitRepairRequest() {
  const { actor } = useActor(createActor);
  return useMutation<RepairCode, Error, RepairRequestInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.submitRepairRequest(input);
    },
  });
}

/** Look up a single repair by code and/or phone. */
export function useLookupRepair(code: string | null, phone: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LookupResult>({
    queryKey: repairKeys.lookup(code, phone),
    queryFn: async () => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.lookupRepair(code, phone);
    },
    enabled: !!actor && !isFetching && (!!code || !!phone),
  });
}

/* ------------------------------------------------------------------ */
/* Admin operations                                                    */
/* ------------------------------------------------------------------ */

/** List all orders still in progress. Admin only. */
export function usePendingRepairs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminRepairView[]>({
    queryKey: repairKeys.pending,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingRepairs();
    },
    enabled: !!actor && !isFetching,
  });
}

/** List all delivered orders. Admin only. */
export function useCompletedRepairs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AdminRepairView[]>({
    queryKey: repairKeys.completed,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCompletedRepairs();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Search orders by name, phone, code or model. Admin only. */
export function useSearchRepairs(term: string) {
  const { actor, isFetching } = useActor(createActor);
  const trimmed = term.trim();
  return useQuery<AdminRepairView[]>({
    queryKey: repairKeys.search(trimmed),
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchRepairs(trimmed);
    },
    enabled: !!actor && !isFetching && trimmed.length > 0,
  });
}

/** Create a repair order from an admin intake form. Admin only. */
export function useCreateRepairOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<AdminRepairView, Error, IntakeInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.createRepairOrder(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

/** Update an order's diagnosis, price, deposit, estimate and observations. */
export function useUpdateRepairOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    AdminRepairView,
    Error,
    { id: OrderId; update: RepairOrderUpdate }
  >({
    mutationFn: async ({ id, update }) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.updateRepairOrder(id, update);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

/** Change an order's status, optionally notifying the client by email. */
export function useChangeRepairStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    StatusChangeResult,
    Error,
    { id: OrderId; status: RepairStatus; notify: boolean }
  >({
    mutationFn: async ({ id, status, notify }) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.changeRepairStatus(id, status, notify);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

/** Attach additional damage and device photos to an order. Admin only. */
export function useAddOrderPhotos() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    AdminRepairView,
    Error,
    { id: OrderId; damagePhotoFileIds: string[]; devicePhotoFileIds: string[] }
  >({
    mutationFn: async ({ id, damagePhotoFileIds, devicePhotoFileIds }) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.addOrderPhotos(id, damagePhotoFileIds, devicePhotoFileIds);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["repairs"] });
    },
  });
}

/** Retrieve the private DNI photo file id for an order. Admin only. */
export function useDniPhoto(id: OrderId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string | null>({
    queryKey: ["repairs", "dni", id?.toString() ?? null],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getDniPhoto(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/* ------------------------------------------------------------------ */
/* Authorization                                                       */
/* ------------------------------------------------------------------ */

/** Whether the current caller is an authorized administrator. */
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<boolean>({
    queryKey: repairKeys.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
