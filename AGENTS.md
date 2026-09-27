# Project Guidance

## User Preferences

- App language: Spanish (all user-facing text)
- Design: modern, professional and technological, related to cell phone repair
- Use the provided L&G TECH logo as the brand mark
- Palette: electric blue, cyan, black and white
- Mobile-first responsive layout
- The DNI photo is private and only visible in the authorized admin panel, never in the public customer lookup

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend: Enhanced Migration with a single migration file (OldActor={} -> full state) when the deployed baseline is empty and check-limit=1; a separate init migration plus a change migration both count as pending and fail the limit.
- Backend: requireAdmin must use a non-trapping role lookup (read accessControlState.userRoles directly); AccessControl.isAdmin traps with 'User is not registered' for unregistered non-anonymous callers.
- Backend: OQL manual entities expose ?Text fields via .payload(name, func r = r.field ?? ""); every persisted queryable map should be registered in Expose with a .sample(...) call.
- Backend: when a lookup accepts two identifiers (code + phone), require both to match; a `case (?c, _)` pattern silently ignores the second field the UI advertises.
- Frontend: FileId is a plain Text hash — resolve display URLs with StorageClient.getDirectURL (resolveFileUrl in lib/storage.ts); a hardcoded /api/file/<hash> path is not a served route.
- Frontend: TanStack Router validateSearch must mark every key optional or Link/navigate with search={{}} fails TS2322.
- Frontend: optional date fields should be omitted from the update payload when empty rather than sent as 0n (which stores ?0 and renders as 01 ene 1970); guard display with a > 0n timestamp check.
- Frontend: the frontend test suite mocks useRepairApi and core-infrastructure, so it never exercises the real actor, Internet Identity, object storage, or email.
- Testing: the PocketIC lane defaults the actor sender to Principal.anonymous(), so _initialize_access_control is a no-op; install and call as a deterministic non-anonymous identity to exercise admin endpoints.
- WORKSHOP in src/frontend/src/lib/repair.ts is the single source of truth for business contact details (name, tagline, phone, email, address, hours); Layout.tsx and HomePage.tsx render WORKSHOP.address, so one edit covers both surfaces.
