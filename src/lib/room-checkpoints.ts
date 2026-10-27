import { indoorFloorConfigs } from '../data/indoorMapData.js';
import type { FloorId } from './floor-checkpoints';

export type RoomCheckpoint = Readonly<{ id: string; floorId: FloorId; name: string }>;

// Keep existing room IDs stable, including the renamed office's original `soci` ID.
const enabledRoomIds = new Set([
  'comp-lab-1', 'comp-lab-2', 'comp-lab-3', 'computer-lab-4', 'computer-lab-5',
  'soci', 'room-501', 'room-502', 'room-503', 'room-504', 'room-505',
]);

export const ROOM_CHECKPOINTS: ReadonlyArray<RoomCheckpoint> = Object.values(indoorFloorConfigs)
  .flatMap(floor => floor.rooms.filter(room => enabledRoomIds.has(room.id))
    .map(room => ({ id: room.id, floorId: floor.id as FloorId, name: room.name })));

export function roomMapPath(roomId: string): string {
  if (!ROOM_CHECKPOINTS.some(room => room.id === roomId)) throw new Error('Unsupported room QR destination.');
  return `/app/map?view=indoor&room=${encodeURIComponent(roomId)}`;
}

export function roomFromSearch(search: string): RoomCheckpoint | null {
  const params = new URLSearchParams(search);
  if ([...params].length !== 2 || params.getAll('view').length !== 1 ||
      params.get('view') !== 'indoor' || params.getAll('room').length !== 1) return null;
  return ROOM_CHECKPOINTS.find(room => room.id === params.get('room')) ?? null;
}

/** Only our exact route and allowlisted room payloads are QR destinations. */
export function parseRoomCheckpoint(text: string, origin: string): RoomCheckpoint | null {
  try {
    const value = text.trim();
    if (!value.startsWith('/app/map?') && !value.startsWith(`${origin}/app/map?`)) return null;
    const url = new URL(value, origin);
    if (url.origin !== origin || url.pathname !== '/app/map' || url.hash) return null;
    return roomFromSearch(url.search);
  } catch {
    return null;
  }
}
