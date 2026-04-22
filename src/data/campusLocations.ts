import buildingMapData from "./buildingMapData";

export type LocationIconKey =
  | "library"
  | "lab"
  | "office"
  | "classroom"
  | "canteen"
  | "computer"
  | "facility"
  | "guidance"
  | "media"
  | "conference";

export interface CampusLocation {
  id: string;
  name: string;
  category: string;
  floor: string;
  building: string;
  icon_key: LocationIconKey;
  color: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

type BuildingFloor =
  | "1st-floor"
  | "2nd-floor"
  | "3rd-floor"
  | "4th-floor"
  | "5th-floor";

interface BuildingRoomSeed {
  id: string;
  name: string;
  category: string;
  description?: string;
}

const floorRoomMap = buildingMapData as Record<
  BuildingFloor,
  BuildingRoomSeed[]
>;

const OLFU_CENTER_LAT = 14.679975;
const OLFU_CENTER_LNG = 120.981499;

const buildingName = "Saint Benedict Hall Building";

const categoryIconMap: Record<string, LocationIconKey> = {
  lab: "lab",
  classroom: "classroom",
  office: "office",
  facility: "facility",
  faculty: "conference",
};

const categoryColorMap: Record<string, string> = {
  lab: "#059669",
  classroom: "#D97706",
  office: "#8A2D1A",
  facility: "#374151",
  faculty: "#7C3AED",
};

function formatFloorLabel(floor: string) {
  return floor
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const roomLocations: CampusLocation[] = Object.entries(floorRoomMap).flatMap(
  ([floor, rooms]) =>
    rooms.map((room) => {
      const categoryKey = String(room.category || "facility").toLowerCase();
      return {
        id: `room-${room.id}`,
        name: room.name,
        category: categoryKey,
        floor: formatFloorLabel(floor),
        building: buildingName,
        icon_key: categoryIconMap[categoryKey] ?? "facility",
        color: categoryColorMap[categoryKey] ?? "#8A2D1A",
        description: room.description ?? `${room.name} inside ${buildingName}`,
        latitude: null,
        longitude: null,
      };
    }),
);

const buildingMarkers: CampusLocation[] = [
  {
    id: "building-saint-benedict-hall",
    name: "Saint Benedict Hall",
    category: "building",
    floor: "Ground",
    building: buildingName,
    icon_key: "office",
    color: "#8A2D1A",
    description: "Main CCS building",
    latitude: OLFU_CENTER_LAT,
    longitude: OLFU_CENTER_LNG,
  },
  {
    id: "building-pope-john-paul",
    name: "Pope John Paul Building",
    category: "building",
    floor: "Ground",
    building: "Pope John Paul Building",
    icon_key: "office",
    color: "#2563EB",
    description: "Secondary campus building",
    latitude: OLFU_CENTER_LAT + 0.00034,
    longitude: OLFU_CENTER_LNG - 0.00045,
  },
];

export const campusLocations: CampusLocation[] = [
  ...buildingMarkers,
  ...roomLocations,
].sort((a, b) => a.name.localeCompare(b.name));

export const campusLocationById = new Map(
  campusLocations.map((location) => [location.id, location]),
);
