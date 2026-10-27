import type { FloorId } from '../lib/floor-checkpoints';

export type IndoorRoomType = 'room' | 'lab' | 'stairs' | 'restroom' | 'utility' |
  'office' | 'faculty' | 'cafeteria' | 'exit' | 'elevator' | 'entrance';

export interface IndoorRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: IndoorRoomType;
  h3d: number;
}

export interface IndoorFloorConfig {
  id: FloorId;
  label: string;
  title: string;
  rooms: IndoorRoom[];
}

export const indoorFloorConfigs: Record<FloorId, IndoorFloorConfig>;
