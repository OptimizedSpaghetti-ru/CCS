import { ROOM_CHECKPOINTS, roomFromSearch, roomMapPath } from './room-checkpoints.ts';

export type FloorId = "1st" | "2nd" | "3rd" | "4th" | "5th";

export const FLOOR_CHECKPOINTS: ReadonlyArray<{ id: FloorId; label: string }> = [
  { id: "1st", label: "1st Floor" },
  { id: "2nd", label: "2nd Floor" },
  { id: "3rd", label: "3rd Floor" },
  { id: "4th", label: "4th Floor" },
  { id: "5th", label: "5th Floor" },
];

export function floorFromSearch(search: string): FloorId | null {
  const params = new URLSearchParams(search);
  const floors = params.getAll("floor");
  return floors.length === 1 && FLOOR_CHECKPOINTS.some(floor => floor.id === floors[0])
    ? floors[0] as FloorId
    : null;
}

export function floorMapPath(floor: FloorId): string {
  return `/app/map?view=indoor&floor=${floor}`;
}

/** Accept only our exact floor-link format. Scanned text is never a redirect. */
export function parseFloorCheckpoint(text: string, origin: string): FloorId | null {
  try {
    const value = text.trim();
    const url = new URL(value, origin);
    const relative = value.startsWith("/app/map?");
    const absolute = value.startsWith(`${origin}/app/map?`);
    if ((!relative && !absolute) || url.origin !== origin || url.pathname !== "/app/map" || url.hash) return null;
    const entries = [...url.searchParams.entries()];
    if (entries.length !== 2 || url.searchParams.get("view") !== "indoor") return null;
    return floorFromSearch(url.search);
  } catch {
    return null;
  }
}

type CheckpointStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const PENDING_FLOOR_KEY = "ccs-connect-pending-floor";
const PENDING_ROOM_KEY = "ccs-connect-pending-room";

// Storage is optional; never retain arbitrary redirect URLs.
export function rememberMapCheckpoint(search: string, storage?: CheckpointStorage): void {
  const room = roomFromSearch(search);
  const floor = new URLSearchParams(search).has('room') ? null : floorFromSearch(search);
  if (!room && !floor) return;
  try {
    const target = storage ?? window.sessionStorage;
    target.removeItem(PENDING_ROOM_KEY);
    target.removeItem(PENDING_FLOOR_KEY);
    if (room) target.setItem(PENDING_ROOM_KEY, room.id);
    else if (floor) target.setItem(PENDING_FLOOR_KEY, floor);
  } catch { /* Storage is optional. */ }
}

export function consumeMapCheckpoint(storage?: CheckpointStorage): string | null {
  try {
    const target = storage ?? window.sessionStorage;
    const roomId = target.getItem(PENDING_ROOM_KEY);
    const floor = target.getItem(PENDING_FLOOR_KEY);
    target.removeItem(PENDING_ROOM_KEY);
    target.removeItem(PENDING_FLOOR_KEY);
    if (roomId !== null) return ROOM_CHECKPOINTS.some(room => room.id === roomId) ? roomMapPath(roomId) : null;
    return FLOOR_CHECKPOINTS.some(item => item.id === floor) ? floorMapPath(floor as FloorId) : null;
  } catch {
    return null;
  }
}
