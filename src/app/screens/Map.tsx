import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  LocateFixed,
  Minus,
  Navigation,
  PauseCircle,
  PlayCircle,
  Plus,
  Volume2,
  Search,
  X,
  Undo2,
} from "lucide-react";
import { c, fonts, shadow } from "../theme";

declare global {
  interface Window {
    CCSAndroidBridge?: {
      speak?: (text: string) => void;
      stopSpeech?: () => void;
      shareBase64File?: (
        filename: string,
        mimeType: string,
        base64Data: string,
      ) => void;
    };
  }
}

type RoomType =
  | "room"
  | "lab"
  | "stairs"
  | "restroom"
  | "utility"
  | "office"
  | "faculty"
  | "cafeteria"
  | "exit"
  | "elevator"
  | "entrance";

type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: RoomType;
  h3d: number;
};

type FloorId = "1st" | "2nd" | "3rd" | "4th" | "5th";

type FloorConfig = {
  id: FloorId;
  label: string;
  title: string;
  rooms: Room[];
};

type RoomCategory =
  | "all"
  | "computer-lab"
  | "lecture"
  | "faculty"
  | "office"
  | "library"
  | "comfort-room"
  | "staircase"
  | "elevator"
  | "facility";

type RoomRef = {
  floorId: FloorId;
  floorLabel: string;
  room: Room;
  category: RoomCategory;
};

type RouteInstruction = {
  id: string;
  floorId: FloorId;
  title: string;
  detail: string;
  voicePrompt: string;
};

type NavigationPin = {
  floorId: FloorId;
  x: number;
  y: number;
  heading: number;
};

type VoiceNavigationArchitecture = {
  routeGeneration: string[];
  instructionParser: string[];
  voiceQueue: string[];
  triggerPoints: string[];
  mobileRuntime: string[];
  futureExpansion: string[];
};

const firstFloorRooms: Room[] = [
  { id: "pt-lecture", name: "Physical Therapy Lecture Room", x: 40, y: 40, w: 220, h: 120, type: "room", h3d: 32 },
  { id: "pt-lab", name: "PT Laboratory 1", x: 265, y: 40, w: 150, h: 120, type: "lab", h3d: 34 },
  { id: "mac-lab", name: "MAC Laboratory", x: 420, y: 40, w: 150, h: 120, type: "lab", h3d: 34 },
  { id: "comp-lab-2", name: "Computer Lab 2", x: 575, y: 40, w: 150, h: 120, type: "lab", h3d: 34 },
  { id: "comp-lab-1", name: "Computer Lab 1", x: 730, y: 40, w: 150, h: 120, type: "lab", h3d: 34 },
  { id: "stairs-west", name: "Stairs to 2F", x: -35, y: 95, w: 65, h: 95, type: "stairs", h3d: 24 },
  { id: "comp-lab-3", name: "Computer Lab 3", x: 40, y: 410, w: 150, h: 145, type: "lab", h3d: 34 },
  { id: "female-cr", name: "Female Restroom", x: 200, y: 390, w: 95, h: 80, type: "restroom", h3d: 24 },
  { id: "male-cr", name: "Male Restroom", x: 200, y: 475, w: 95, h: 80, type: "restroom", h3d: 24 },
  { id: "pwd-cr", name: "PWD / All Gender CR", x: 310, y: 430, w: 110, h: 125, type: "restroom", h3d: 24 },
  { id: "stock", name: "Stock Room", x: 425, y: 430, w: 90, h: 125, type: "utility", h3d: 26 },
  { id: "soci", name: "SOCI & Co-Curricular Office", x: 520, y: 430, w: 150, h: 125, type: "office", h3d: 30 },
  { id: "cafeteria", name: "Cafeteria", x: 675, y: 405, w: 120, h: 150, type: "cafeteria", h3d: 30 },
  { id: "parking", name: "To Parking Lot", x: 800, y: 505, w: 120, h: 70, type: "exit", h3d: 12 },
  { id: "elevator", name: "Elevator", x: 925, y: 450, w: 70, h: 105, type: "elevator", h3d: 35 },
  { id: "stairs-south", name: "Stairs to 2F", x: 1010, y: 455, w: 70, h: 100, type: "stairs", h3d: 24 },
  { id: "entrance", name: "Entrance", x: 1005, y: 190, w: 60, h: 80, type: "entrance", h3d: 16 },
];

const secondFloorRooms: Room[] = [
  { id: "ccs-office", name: "College of Computer Studies Office", x: 40, y: 40, w: 280, h: 120, type: "office", h3d: 32 },
  { id: "it-ojt-room", name: "IT / OJT Room", x: 325, y: 40, w: 150, h: 120, type: "room", h3d: 30 },
  { id: "clinic", name: "Clinic", x: 480, y: 40, w: 150, h: 120, type: "office", h3d: 30 },
  { id: "tamaraw-library", name: "Tamaraw Library", x: 635, y: 40, w: 270, h: 120, type: "room", h3d: 32 },
  { id: "general-office", name: "General Office", x: 910, y: 40, w: 170, h: 120, type: "office", h3d: 30 },
  { id: "stairs-west", name: "Stairs to 3F", x: -35, y: 95, w: 65, h: 95, type: "stairs", h3d: 24 },
  { id: "computer-lab-4", name: "Computer Lab 4", x: 40, y: 410, w: 210, h: 145, type: "lab", h3d: 34 },
  { id: "female-cr", name: "Female Restroom", x: 290, y: 390, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "male-cr", name: "Male Restroom", x: 290, y: 475, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "elevator", name: "Elevator", x: 925, y: 455, w: 130, h: 100, type: "elevator", h3d: 35 },
  { id: "stairs-east-upper", name: "Stairs to 3F", x: 1030, y: 185, w: 70, h: 90, type: "stairs", h3d: 24 },
  { id: "stairs-east-lower", name: "Stairs to 3F", x: 1030, y: 315, w: 70, h: 95, type: "stairs", h3d: 24 },
];

const thirdFloorRooms: Room[] = [
  { id: "faculty-room-west", name: "Faculty Room", x: 40, y: 40, w: 110, h: 120, type: "faculty", h3d: 30 },
  { id: "room-306", name: "Room 306", x: 155, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-305-b", name: "Room 305 B", x: 270, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-305-a", name: "Room 305 A", x: 385, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-304-b", name: "Room 304 B", x: 500, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-304-a", name: "Room 304 A", x: 615, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "faculty-room", name: "Faculty Room", x: 730, y: 40, w: 210, h: 120, type: "faculty", h3d: 30 },
  { id: "room-302", name: "Room 302", x: 945, y: 40, w: 70, h: 120, type: "room", h3d: 28 },
  { id: "room-301", name: "Room 301", x: 1020, y: 40, w: 70, h: 120, type: "room", h3d: 28 },
  { id: "stairs-west", name: "Stairs to 4F", x: -35, y: 95, w: 65, h: 95, type: "stairs", h3d: 24 },
  { id: "room-307", name: "Room 307", x: 40, y: 410, w: 210, h: 145, type: "room", h3d: 32 },
  { id: "female-cr", name: "Female Restroom", x: 290, y: 390, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "male-cr", name: "Male Restroom", x: 290, y: 475, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "elevator", name: "Elevator", x: 925, y: 455, w: 130, h: 100, type: "elevator", h3d: 35 },
  { id: "stairs-east-upper", name: "Stairs to 4F", x: 1030, y: 185, w: 70, h: 90, type: "stairs", h3d: 24 },
  { id: "stairs-east-lower", name: "Stairs to 4F", x: 1030, y: 315, w: 70, h: 95, type: "stairs", h3d: 24 },
];

const fourthFloorRooms: Room[] = [
  { id: "room-407-b", name: "Room 407 B", x: 40, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-407-a", name: "Room 407 A", x: 155, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-406-b", name: "Room 406 B", x: 270, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-406-a", name: "Room 406 A", x: 385, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "room-405", name: "Room 405", x: 500, y: 40, w: 110, h: 120, type: "room", h3d: 30 },
  { id: "psychology-lab", name: "Psychology Laboratory", x: 615, y: 40, w: 195, h: 120, type: "lab", h3d: 34 },
  { id: "room-403", name: "Room 403", x: 815, y: 40, w: 90, h: 120, type: "room", h3d: 28 },
  { id: "room-402", name: "Room 402", x: 910, y: 40, w: 90, h: 120, type: "room", h3d: 28 },
  { id: "room-401", name: "Room 401", x: 1005, y: 40, w: 85, h: 120, type: "room", h3d: 28 },
  { id: "stairs-west", name: "Stairs to 5F", x: -35, y: 95, w: 65, h: 95, type: "stairs", h3d: 24 },
  { id: "room-408", name: "Room 408", x: 40, y: 410, w: 210, h: 145, type: "room", h3d: 32 },
  { id: "female-cr", name: "Female Restroom", x: 290, y: 390, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "male-cr", name: "Male Restroom", x: 290, y: 475, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "elevator", name: "Elevator", x: 925, y: 455, w: 130, h: 100, type: "elevator", h3d: 35 },
  { id: "stairs-east-upper", name: "Stairs to 5F", x: 1030, y: 185, w: 70, h: 90, type: "stairs", h3d: 24 },
  { id: "stairs-east-lower", name: "Stairs to 5F", x: 1030, y: 315, w: 70, h: 95, type: "stairs", h3d: 24 },
];

const fifthFloorRooms: Room[] = [
  { id: "chemistry-lab", name: "Chemistry Laboratory", x: 40, y: 40, w: 195, h: 120, type: "lab", h3d: 34 },
  { id: "room-507", name: "Room 507", x: 240, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-506-b", name: "Room 506 B", x: 350, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-506-a", name: "Room 506 A", x: 460, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-505", name: "Room 505", x: 570, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-504", name: "Room 504", x: 680, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-503", name: "Room 503", x: 790, y: 40, w: 105, h: 120, type: "room", h3d: 30 },
  { id: "room-502", name: "Room 502", x: 900, y: 40, w: 90, h: 120, type: "room", h3d: 28 },
  { id: "room-501", name: "Room 501", x: 995, y: 40, w: 95, h: 120, type: "room", h3d: 28 },
  { id: "stairs-west", name: "Stairs to 4F", x: -35, y: 95, w: 65, h: 95, type: "stairs", h3d: 24 },
  { id: "computer-lab-5", name: "Computer Lab 5", x: 40, y: 410, w: 210, h: 145, type: "lab", h3d: 34 },
  { id: "female-cr", name: "Female Restroom", x: 290, y: 390, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "male-cr", name: "Male Restroom", x: 290, y: 475, w: 110, h: 80, type: "restroom", h3d: 24 },
  { id: "elevator", name: "Elevator", x: 925, y: 455, w: 130, h: 100, type: "elevator", h3d: 35 },
  { id: "stairs-east", name: "Stairs to 4F", x: 1030, y: 215, w: 70, h: 105, type: "stairs", h3d: 24 },
];

const floorConfigs: Record<FloorId, FloorConfig> = {
  "1st": {
    id: "1st",
    label: "1st Floor",
    title: "ST. BENEDICT HALL 1ST FLOOR",
    rooms: firstFloorRooms,
  },
  "2nd": {
    id: "2nd",
    label: "2nd Floor",
    title: "ST. BENEDICT HALL 2ND FLOOR",
    rooms: secondFloorRooms,
  },
  "3rd": {
    id: "3rd",
    label: "3rd Floor",
    title: "ST. BENEDICT HALL 3RD FLOOR",
    rooms: thirdFloorRooms,
  },
  "4th": {
    id: "4th",
    label: "4th Floor",
    title: "ST. BENEDICT HALL 4TH FLOOR",
    rooms: fourthFloorRooms,
  },
  "5th": {
    id: "5th",
    label: "5th Floor",
    title: "ST. BENEDICT HALL 5TH FLOOR",
    rooms: fifthFloorRooms,
  },
};

const floorOptions = Object.values(floorConfigs);
const DEFAULT_NAVIGATION_PIN: NavigationPin = {
  floorId: "1st",
  x: 1035,
  y: 230,
  heading: 20,
};
const CURRENT_LOCATION_STORAGE_KEY = "ccs-indoor-current-location";
const OLD_DEFAULT_NAVIGATION_PIN = { x: 965, y: 240 };
const MAP_BOUNDS = {
  minX: -45,
  maxX: 1085,
  minY: 35,
  maxY: 570,
};

const categoryOptions: Array<{ value: RoomCategory; label: string }> = [
  { value: "all", label: "All rooms" },
  { value: "computer-lab", label: "Computer Laboratory" },
  { value: "lecture", label: "Lecture Rooms" },
  { value: "faculty", label: "Faculty Rooms" },
  { value: "office", label: "Offices" },
  { value: "library", label: "Library" },
  { value: "comfort-room", label: "Comfort Rooms" },
  { value: "staircase", label: "Staircases" },
  { value: "elevator", label: "Elevator" },
  { value: "facility", label: "Other Facilities" },
];

type RoomCategoryStyle = {
  top: string;
  label: string;
  symbol: string;
};

const categoryRoomStyles: Record<Exclude<RoomCategory, "all">, RoomCategoryStyle> = {
  "computer-lab": {
    top: "#BFD7F2",
    label: "#1E3A5F",
    symbol: "#1E4E79",
  },
  lecture: {
    top: "#C8E6C9",
    label: "#244D2C",
    symbol: "#2F6B3A",
  },
  faculty: {
    top: "#D8C7EA",
    label: "#472A63",
    symbol: "#5C3A78",
  },
  office: {
    top: "#F2C99A",
    label: "#63320D",
    symbol: "#8C4B13",
  },
  library: {
    top: "#DCC07A",
    label: "#53360A",
    symbol: "#745014",
  },
  "comfort-room": {
    top: "#B8E1DC",
    label: "#164C49",
    symbol: "#1F6A65",
  },
  staircase: {
    top: "#D7D2C8",
    label: "#403A34",
    symbol: "#5A534A",
  },
  elevator: {
    top: "#4A423D",
    label: "#FFF0C4",
    symbol: "#0F0F0F",
  },
  facility: {
    top: "#F2C1BD",
    label: "#6B211B",
    symbol: "#8C1007",
  },
};

function getRoomCategory(room: Room): RoomCategory {
  const name = room.name.toLowerCase();

  if (room.type === "stairs") return "staircase";
  if (room.type === "elevator") return "elevator";
  if (room.type === "restroom") return "comfort-room";
  if (room.type === "faculty") return "faculty";
  if (name.includes("library")) return "library";
  if (room.type === "lab" || name.includes("computer lab")) return "computer-lab";
  if (room.type === "office" || name.includes("office")) return "office";
  if (room.type === "room" || name.includes("lecture")) return "lecture";

  return "facility";
}

function getRoomCategoryStyle(room: Room) {
  const category = getRoomCategory(room);
  return category === "all" ? categoryRoomStyles.facility : categoryRoomStyles[category];
}

function getRoomCenter(room: Room) {
  return {
    x: room.x + room.w / 2,
    y: room.y + room.h / 2,
  };
}

function isWithinMapBounds(x: number, y: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= MAP_BOUNDS.minX &&
    x <= MAP_BOUNDS.maxX &&
    y >= MAP_BOUNDS.minY &&
    y <= MAP_BOUNDS.maxY
  );
}

function isValidNavigationPin(pin: Partial<NavigationPin>) {
  return Boolean(
    pin.floorId &&
      floorConfigs[pin.floorId] &&
      typeof pin.x === "number" &&
      typeof pin.y === "number" &&
      isWithinMapBounds(pin.x, pin.y),
  );
}

function isOldDefaultNavigationPin(pin: Partial<NavigationPin>) {
  return (
    pin.floorId === "1st" &&
    pin.x === OLD_DEFAULT_NAVIGATION_PIN.x &&
    pin.y === OLD_DEFAULT_NAVIGATION_PIN.y
  );
}

function getStoredNavigationPin() {
  if (typeof window === "undefined") return DEFAULT_NAVIGATION_PIN;

  try {
    const raw = window.localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
    if (!raw) return DEFAULT_NAVIGATION_PIN;
    const parsed = JSON.parse(raw) as Partial<NavigationPin>;
    if (isOldDefaultNavigationPin(parsed)) {
      persistNavigationPin(DEFAULT_NAVIGATION_PIN);
      return DEFAULT_NAVIGATION_PIN;
    }
    if (isValidNavigationPin(parsed)) {
      return {
        floorId: parsed.floorId!,
        x: parsed.x!,
        y: parsed.y!,
        heading: typeof parsed.heading === "number" ? parsed.heading : 0,
      };
    }
  } catch {
    persistNavigationPin(DEFAULT_NAVIGATION_PIN);
    return DEFAULT_NAVIGATION_PIN;
  }

  persistNavigationPin(DEFAULT_NAVIGATION_PIN);
  return DEFAULT_NAVIGATION_PIN;
}

function persistNavigationPin(pin: NavigationPin) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, JSON.stringify(pin));
}

function getRoomNavigationPin(floorId: FloorId, room: Room): NavigationPin {
  const center = getRoomCenter(room);
  const pin = {
    floorId,
    x: center.x,
    y: center.y,
    heading: 0,
  };
  return isValidNavigationPin(pin) ? pin : DEFAULT_NAVIGATION_PIN;
}

function getSortedRooms(rooms: Room[]) {
  return [...rooms].sort((a, b) => {
    const rowDelta = a.y - b.y;
    if (Math.abs(rowDelta) > 48) return rowDelta;
    return b.x - a.x;
  });
}

const allRoomRefs: RoomRef[] = floorOptions.flatMap((floor) =>
  floor.rooms.map((room) => ({
    floorId: floor.id,
    floorLabel: floor.label,
    room,
    category: getRoomCategory(room),
  })),
);

const voiceNavigationArchitecture: VoiceNavigationArchitecture = {
  routeGeneration: [
    "Reuse the current floor graph, transition nodes, and destination node to build route segments.",
    "Store every generated step with floorId, route point, instruction text, and voicePrompt.",
  ],
  instructionParser: [
    "Convert route segments into human instructions such as continue forward, turn left, use elevator, and destination side.",
    "Generate separate floor-transition instructions for staircase/elevator movement.",
  ],
  voiceQueue: [
    "Use a single speech queue so prompts never overlap.",
    "Cancel and rebuild the queue whenever the destination or route changes.",
  ],
  triggerPoints: [
    "Speak on route start, near turns, before floor transitions, after floor switch, and near destination.",
    "Future live positioning can trigger prompts by distance to each route point.",
  ],
  mobileRuntime: [
    "Use Web Speech API SpeechSynthesis in the current web/Capacitor build.",
    "Swap to a native TTS plugin later if Android background or richer voice controls are required.",
  ],
  futureExpansion: [
    "Attach indoor positioning, beacon data, live rerouting, and off-route detection to the same instruction model.",
  ],
};

function getTransitionRoom(rooms: Room[]) {
  return (
    rooms.find((room) => room.type === "elevator") ??
    rooms.find((room) => room.id.includes("stairs-east")) ??
    rooms.find((room) => room.type === "stairs") ??
    rooms[0]
  );
}

function getFloorNumber(floorId: FloorId) {
  return Number.parseInt(floorId, 10);
}

function getDestinationSide(fromX: number, toX: number) {
  const delta = toX - fromX;
  if (Math.abs(delta) < 90) return "ahead";
  return delta < 0 ? "right" : "left";
}

function getHallwaySide(y: number) {
  return y < 310 ? "upper" : "lower";
}

function getMovementInstruction(
  from: { x: number; y: number },
  to: { x: number; y: number },
  destinationName: string,
) {
  const deltaX = to.x - from.x;
  const sameSide = getHallwaySide(from.y) === getHallwaySide(to.y);
  const horizontal =
    Math.abs(deltaX) < 90
      ? "continue forward"
      : deltaX < 0
        ? "turn right"
        : "turn left";

  if (!sameSide && Math.abs(deltaX) < 120) {
    return {
      title: "Cross the hallway",
      detail: `Cross to the opposite side of the hallway toward ${destinationName}.`,
      voicePrompt: `Cross the hallway toward ${destinationName}.`,
    };
  }

  if (!sameSide) {
    return {
      title: `Cross hallway, then ${horizontal}`,
      detail: `Cross to the opposite side of the hallway, then ${horizontal} toward ${destinationName}.`,
      voicePrompt: `Cross the hallway, then ${horizontal} toward ${destinationName}.`,
    };
  }

  return {
    title: horizontal.replace(/^\w/, (char) => char.toUpperCase()),
    detail: `${horizontal.replace(/^\w/, (char) => char.toUpperCase())} along the hallway toward ${destinationName}.`,
    voicePrompt: `${horizontal} toward ${destinationName}.`,
  };
}

function buildRouteInstructions({
  currentFloorId,
  currentPoint,
  targetFloorId,
  targetRoom,
}: {
  currentFloorId: FloorId;
  currentPoint: { x: number; y: number };
  targetFloorId: FloorId;
  targetRoom: Room;
}) {
  const instructions: RouteInstruction[] = [];
  const targetCenter = getRoomCenter(targetRoom);

  if (targetFloorId === currentFloorId) {
    const move = getMovementInstruction(
      currentPoint,
      targetCenter,
      targetRoom.name,
    );
    const side = getDestinationSide(currentPoint.x, targetCenter.x);
    instructions.push(
      {
        id: "start-same-floor",
        floorId: currentFloorId,
        title: "Start route",
        detail: "Enter the main hallway from your current position.",
        voicePrompt: "Start route. Enter the main hallway.",
      },
      {
        id: "move-same-floor",
        floorId: currentFloorId,
        title: move.title,
        detail: move.detail,
        voicePrompt: move.voicePrompt,
      },
      {
        id: "arrive-same-floor",
        floorId: currentFloorId,
        title: "Arrive at destination",
        detail: `${targetRoom.name} is on your ${side}.`,
        voicePrompt: `Your destination, ${targetRoom.name}, is on your ${side}.`,
      },
    );
    return instructions;
  }

  const currentTransition = getTransitionRoom(floorConfigs[currentFloorId].rooms);
  const targetTransition = getTransitionRoom(floorConfigs[targetFloorId].rooms);
  const currentTransitionCenter = getRoomCenter(currentTransition);
  const targetTransitionCenter = getRoomCenter(targetTransition);
  const firstMove = getMovementInstruction(
    currentPoint,
    currentTransitionCenter,
    currentTransition.name,
  );
  const exitMove = getMovementInstruction(
    targetTransitionCenter,
    targetCenter,
    targetRoom.name,
  );
  const side = getDestinationSide(targetTransitionCenter.x, targetCenter.x);
  const movement =
    getFloorNumber(targetFloorId) > getFloorNumber(currentFloorId)
      ? "Go up"
      : "Go down";
  const targetFloorLabel = floorConfigs[targetFloorId].label;

  instructions.push(
    {
      id: "start-cross-floor",
      floorId: currentFloorId,
      title: "Start route",
      detail: "Enter the main hallway from your current position.",
      voicePrompt: "Start route. Enter the main hallway.",
    },
    {
      id: "transition-approach",
      floorId: currentFloorId,
      title: `Proceed to ${currentTransition.name}`,
      detail: firstMove.detail,
      voicePrompt: firstMove.voicePrompt,
    },
    {
      id: "floor-change",
      floorId: currentFloorId,
      title: `${movement} to ${targetFloorLabel}`,
      detail: `Use ${currentTransition.name}, then continue on ${targetFloorLabel}.`,
      voicePrompt: `Use ${currentTransition.name}. ${movement} to ${targetFloorLabel}.`,
    },
    {
      id: "exit-transition",
      floorId: targetFloorId,
      title: `Exit ${targetTransition.name}`,
      detail: `Exit ${targetTransition.name}. ${exitMove.detail}`,
      voicePrompt: `Exit ${targetTransition.name}. ${exitMove.voicePrompt}`,
    },
    {
      id: "arrive-cross-floor",
      floorId: targetFloorId,
      title: "Arrive at destination",
      detail: `${targetRoom.name} is on your ${side}.`,
      voicePrompt: `Your destination, ${targetRoom.name}, is on your ${side}.`,
    },
  );

  return instructions;
}

const roomTypeLabels: Record<RoomType, string> = {
  room: "Room",
  lab: "Laboratory",
  stairs: "Stairs",
  restroom: "Restroom",
  utility: "Utility",
  office: "Office",
  faculty: "Faculty",
  cafeteria: "Cafeteria",
  exit: "Exit",
  elevator: "Elevator",
  entrance: "Entrance",
};

function shade(hex: string, percent: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const red = Math.max(0, Math.min(255, (num >> 16) + amt));
  const green = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const blue = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));

  return `#${(0x1000000 + red * 0x10000 + green * 0x100 + blue)
    .toString(16)
    .slice(1)}`;
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        border: "1px solid rgba(102, 11, 5, 0.16)",
        background: "#FFFBEF",
        color: c.baseRed,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 8px 18px rgba(62, 7, 3, 0.11)",
        touchAction: "manipulation",
        pointerEvents: "auto",
      }}
    >
      {children}
    </button>
  );
}

function NavigationMarker({
  x,
  y,
  heading = 0,
}: {
  x: number;
  y: number;
  heading?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${heading})`}
      className="pointer-events-none"
    >
      <circle r="13" fill="#1D4ED8" stroke="#FFFBEF" strokeWidth="5" />
      <circle r="30" fill="#1D4ED8" opacity="0.16" />
      <path d="M0 -18 L12 15 L0 8 L-12 15 Z" fill="#FFFBEF" />
    </g>
  );
}

function RoutePath({ points }: { points: Array<{ x: number; y: number }> }) {
  if (points.length < 2) return null;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <g className="pointer-events-none">
      <path
        d={path}
        fill="none"
        stroke="#FFF0C4"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d={path}
        fill="none"
        stroke="#8C1007"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="18 14"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="32"
          to="0"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 13 : 8}
          fill={index === points.length - 1 ? "#660B05" : "#FFF0C4"}
          stroke="#8C1007"
          strokeWidth="4"
        />
      ))}
      {points.slice(1).map((point, index) => {
        const previous = points[index];
        const angle =
          (Math.atan2(point.y - previous.y, point.x - previous.x) * 180) /
          Math.PI;
        const arrowX = previous.x + (point.x - previous.x) * 0.62;
        const arrowY = previous.y + (point.y - previous.y) * 0.62;

        return (
          <g
            key={`${point.x}-${point.y}-arrow`}
            transform={`translate(${arrowX} ${arrowY}) rotate(${angle})`}
          >
            <path
              d="M -12 -9 L 12 0 L -12 9 Z"
              fill="#8C1007"
              stroke="#FFF0C4"
              strokeWidth="2"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="-5 0; 6 0; -5 0"
                dur="1s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.58;1;0.58"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}
    </g>
  );
}

function RoomLabel({ room, color }: { room: Room; color: string }) {
  const fontSize = room.w < 90 ? 12 : room.w < 130 ? 14 : 17;
  const words = room.name.split(" ");
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (test.length > 18 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  return (
    <text
      x={room.x + room.w / 2}
      y={room.y + room.h / 2 - (lines.length - 1) * 10}
      textAnchor="middle"
      className="pointer-events-none select-none"
      style={{
        fill: color,
        fontFamily: fonts.ui,
        fontSize,
        fontWeight: 800,
        paintOrder: "stroke",
        stroke: "rgba(255, 251, 239, 0.72)",
        strokeWidth: 3,
        strokeLinejoin: "round",
      }}
    >
      {lines.slice(0, 3).map((text, index) => (
        <tspan key={`${text}-${index}`} x={room.x + room.w / 2} dy={index === 0 ? 0 : 22}>
          {text}
        </tspan>
      ))}
    </text>
  );
}

function StairIcon({
  x,
  y,
  w,
  h,
  color,
}: Pick<Room, "x" | "y" | "w" | "h"> & { color: string }) {
  const left = x + Math.max(10, w * 0.16);
  const right = x + w - Math.max(10, w * 0.16);
  const top = y + Math.max(14, h * 0.16);
  const bottom = y + h - Math.max(14, h * 0.16);
  const stepCount = 6;

  return (
    <g className="pointer-events-none">
      <path
        d={`M${left} ${bottom} L${right} ${top}`}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.36"
      />
      {Array.from({ length: stepCount }).map((_, index) => {
        const t = index / (stepCount - 1);
        const yPos = bottom - (bottom - top) * t;
        const startX = left + (right - left) * t - 14;
        const endX = startX + 28;
        return (
          <line
            key={index}
            x1={Math.max(x + 8, startX)}
            y1={yPos}
            x2={Math.min(x + w - 8, endX)}
            y2={yPos}
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      <path
        d={`M${right - 9} ${top + 4} l12 -4 l-4 12`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function ElevatorIcon({
  x,
  y,
  w,
  h,
  color,
}: Pick<Room, "x" | "y" | "w" | "h"> & { color: string }) {
  const boxW = Math.min(58, w * 0.58);
  const boxH = Math.min(66, h * 0.62);
  const boxX = x + w / 2 - boxW / 2;
  const boxY = y + h / 2 - boxH / 2 + 4;

  return (
    <g className="pointer-events-none">
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx="6"
        fill="#FFFBEF"
        stroke={color}
        strokeWidth="4"
      />
      <line
        x1={boxX + boxW / 2}
        y1={boxY + 8}
        x2={boxX + boxW / 2}
        y2={boxY + boxH - 8}
        stroke={color}
        strokeWidth="3"
      />
      <path
        d={`M${boxX + boxW * 0.28} ${boxY - 12} l-8 8 h16 z`}
        fill={color}
      />
      <path
        d={`M${boxX + boxW * 0.72} ${boxY - 4} l-8 -8 h16 z`}
        fill={color}
      />
      <path
        d={`M${boxX + boxW * 0.28} ${boxY + boxH * 0.48} v-18 m0 0 l-8 8 m8 -8 l8 8`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${boxX + boxW * 0.72} ${boxY + boxH * 0.38} v18 m0 0 l-8 -8 m8 8 l8 -8`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function RoomSymbol({ room, color }: { room: Room; color: string }) {
  if (room.type === "stairs") {
    return <StairIcon x={room.x} y={room.y} w={room.w} h={room.h} color={color} />;
  }

  if (room.type === "elevator") {
    return <ElevatorIcon x={room.x} y={room.y} w={room.w} h={room.h} color={color} />;
  }

  return null;
}

function RoomHitbox({
  room,
  setSelectedId,
  canSelect,
}: {
  room: Room;
  setSelectedId: (id: string) => void;
  canSelect: () => boolean;
}) {
  const padX = Math.max(12, Math.min(24, room.w * 0.12));
  const padY = Math.max(12, Math.min(24, room.h * 0.16));

  return (
    <rect
      x={room.x - padX}
      y={room.y - padY}
      width={room.w + padX * 2}
      height={room.h + padY * 2}
      fill="transparent"
      pointerEvents="all"
      style={{ cursor: "pointer" }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (canSelect()) setSelectedId(room.id);
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
        if (canSelect()) setSelectedId(room.id);
      }}
      aria-label={room.name}
    />
  );
}

function IsoRoom({
  room,
  selectedId,
  setSelectedId,
  canSelect,
  dimmed,
  isDestination,
}: {
  room: Room;
  selectedId: string;
  setSelectedId: (id: string) => void;
  canSelect: () => boolean;
  dimmed: boolean;
  isDestination: boolean;
}) {
  const categoryStyle = getRoomCategoryStyle(room);
  const top = categoryStyle.top;
  const isSelected = selectedId === room.id;
  const depth = Math.max(8, Math.min(room.h3d, 28));
  const side = shade(top, -14);
  const front = shade(top, -8);
  const highlight = shade(top, 4);

  return (
    <g
      onClick={() => {
        if (canSelect()) setSelectedId(room.id);
      }}
      style={{
        cursor: "pointer",
        opacity: dimmed ? 0.28 : 1,
        transition: "opacity 0.18s ease, filter 0.18s ease",
        filter: isDestination
          ? "drop-shadow(0 0 10px rgba(140,16,7,0.55))"
          : undefined,
        pointerEvents: "auto",
      }}
      role="button"
      aria-label={room.name}
      tabIndex={0}
      pointerEvents="none"
    >
      <polygon
        points={`${room.x},${room.y + room.h} ${room.x + room.w},${room.y + room.h} ${room.x + room.w + depth},${room.y + room.h - depth} ${room.x + depth},${room.y + room.h - depth}`}
        fill={front}
        stroke="#3E0703"
        strokeWidth="2"
        opacity="0.92"
      />
      <polygon
        points={`${room.x + room.w},${room.y} ${room.x + room.w + depth},${room.y - depth} ${room.x + room.w + depth},${room.y + room.h - depth} ${room.x + room.w},${room.y + room.h}`}
        fill={side}
        stroke="#3E0703"
        strokeWidth="2"
        opacity="0.9"
      />
      <polygon
        points={`${room.x},${room.y} ${room.x + room.w},${room.y} ${room.x + room.w + depth},${room.y - depth} ${room.x + depth},${room.y - depth}`}
        fill={highlight}
        stroke="#3E0703"
        strokeWidth="2"
        opacity="0.92"
      />
      <rect
        x={room.x}
        y={room.y}
        width={room.w}
        height={room.h}
        fill={top}
        stroke={isDestination ? "#8C1007" : isSelected ? "#8C1007" : "#3E0703"}
        strokeWidth={isDestination ? 7 : isSelected ? 5 : 3}
        rx="4"
      />
      <RoomLabel room={room} color={categoryStyle.label} />
      <RoomSymbol room={room} color={categoryStyle.symbol} />
    </g>
  );
}

export function Map() {
  const [selectedFloor, setSelectedFloor] = useState<FloorId>("1st");
  const [selectedId, setSelectedId] = useState("entrance");
  const [activeCategory, setActiveCategory] = useState<RoomCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [navigationTarget, setNavigationTarget] = useState<{
    floorId: FloorId;
    roomId: string;
  } | null>(null);
  const [scale, setScale] = useState(0.58);
  const [rotation, setRotation] = useState(-8);
  const [tilt, setTilt] = useState(58);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isGestureTransforming, setIsGestureTransforming] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<NavigationPin>(
    getStoredNavigationPin,
  );
  const [routeStartLocation, setRouteStartLocation] =
    useState<NavigationPin | null>(null);
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const mapPanRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const mouseRotateRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const touchPinchRef = useRef({
    active: false,
    lastDistance: 0,
    lastAngle: 0,
    lastCenterX: 0,
    lastCenterY: 0,
    tiltPrimed: false,
  });
  const voiceQueueRef = useRef<{
    prompts: string[];
    index: number;
    onComplete?: () => void;
    timeoutId?: number;
  } | null>(null);
  const suppressSelectRef = useRef(false);
  const activeRouteStart = routeStartLocation ?? currentLocation;
  const activeFloor = floorConfigs[selectedFloor];
  const rooms = activeFloor.rooms;
  const sortedRooms = useMemo(() => getSortedRooms(rooms), [rooms]);
  const filteredRoomIds = useMemo(
    () =>
      new Set(
        rooms
          .filter(
            (room) =>
              activeCategory === "all" ||
              getRoomCategory(room) === activeCategory,
          )
          .map((room) => room.id),
      ),
    [activeCategory, rooms],
  );
  const hasCategoryMatches = activeCategory === "all" || filteredRoomIds.size > 0;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];

    return allRoomRefs
      .filter((ref) => {
        const haystack = `${ref.room.name} ${roomTypeLabels[ref.room.type]} ${
          categoryOptions.find((category) => category.value === ref.category)
            ?.label ?? ""
        }`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const aExact = a.room.name.toLowerCase() === normalizedSearch ? 0 : 1;
        const bExact = b.room.name.toLowerCase() === normalizedSearch ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        if (a.floorId !== b.floorId) return a.floorId.localeCompare(b.floorId);
        return a.room.name.localeCompare(b.room.name);
      })
      .slice(0, 8);
  }, [normalizedSearch]);

  const selected = useMemo(
    () => rooms.find((room) => room.id === selectedId) ?? rooms[0],
    [rooms, selectedId],
  );
  const navigationTargetRoom = navigationTarget
    ? floorConfigs[navigationTarget.floorId].rooms.find(
        (room) => room.id === navigationTarget.roomId,
      ) ?? null
    : null;
  const routeInstructions = useMemo(() => {
    if (!navigationTarget || !navigationTargetRoom) return [];

    return buildRouteInstructions({
      currentFloorId: activeRouteStart.floorId,
      currentPoint: { x: activeRouteStart.x, y: activeRouteStart.y },
      targetFloorId: navigationTarget.floorId,
      targetRoom: navigationTargetRoom,
    });
  }, [
    activeRouteStart.floorId,
    activeRouteStart.x,
    activeRouteStart.y,
    navigationTarget,
    navigationTargetRoom,
  ]);
  const activeInstructionIndex = Math.max(
    0,
    routeInstructions.findIndex(
      (instruction) => instruction.floorId === selectedFloor,
    ),
  );
  const routePoints = useMemo(() => {
    if (!navigationTarget || !navigationTargetRoom) return [];

    const destination = getRoomCenter(navigationTargetRoom);

    if (navigationTarget.floorId === activeRouteStart.floorId) {
      if (selectedFloor !== activeRouteStart.floorId) return [];
      return [
        { x: activeRouteStart.x, y: activeRouteStart.y },
        { x: (activeRouteStart.x + destination.x) / 2, y: 310 },
        destination,
      ];
    }

    if (selectedFloor === activeRouteStart.floorId) {
      const transition = getRoomCenter(getTransitionRoom(rooms));
      return [
        { x: activeRouteStart.x, y: activeRouteStart.y },
        { x: (activeRouteStart.x + transition.x) / 2, y: 310 },
        transition,
      ];
    }

    if (selectedFloor === navigationTarget.floorId) {
      const transition = getRoomCenter(getTransitionRoom(rooms));
      return [
        transition,
        { x: (transition.x + destination.x) / 2, y: 310 },
        destination,
      ];
    }

    return [];
  }, [
    activeRouteStart.floorId,
    activeRouteStart.x,
    activeRouteStart.y,
    navigationTarget,
    navigationTargetRoom,
    rooms,
    selectedFloor,
  ]);

  useEffect(() => {
    if (!floorConfigs[selectedFloor].rooms.some((room) => room.id === selectedId)) {
      setSelectedId(floorConfigs[selectedFloor].rooms[0].id);
    }
    resetView();
  }, [selectedFloor]);

  const focusRoom = (floorId: FloorId, roomId: string) => {
    const room = floorConfigs[floorId].rooms.find((item) => item.id === roomId);
    if (!room) return;

    setSelectedFloor(floorId);
    setSelectedId(roomId);
    setSearchQuery("");
    window.setTimeout(() => {
      const center = getRoomCenter(room);
      setPosition(clampPosition((560 - center.x) * scale, (310 - center.y) * scale));
    }, 0);
  };

  const startNavigation = (floorId = selectedFloor, roomId = selectedId) => {
    const routeStart = currentLocation;
    setRouteStartLocation(routeStart);
    setNavigationTarget({ floorId, roomId });
    if (floorId === routeStart.floorId) {
      focusRoom(floorId, roomId);
      return;
    }

    const transitionRoom = getTransitionRoom(floorConfigs[routeStart.floorId].rooms);
    setSelectedFloor(routeStart.floorId);
    setSelectedId(transitionRoom.id);
    setSearchQuery("");
    window.setTimeout(() => {
      setPosition(
        clampPosition((560 - routeStart.x) * scale, (310 - routeStart.y) * scale),
      );
    }, 0);
  };

  const clearNavigation = () => {
    setNavigationTarget(null);
    setRouteStartLocation(null);
    stopVoiceGuidance();
  };

  const completeNavigation = () => {
    if (!navigationTarget || !navigationTargetRoom) return;

    const nextLocation = getRoomNavigationPin(
      navigationTarget.floorId,
      navigationTargetRoom,
    );
    setCurrentLocation(nextLocation);
    persistNavigationPin(nextLocation);
    setSelectedFloor(nextLocation.floorId);
    setNavigationTarget(null);
    setRouteStartLocation(null);
    stopVoiceGuidance();
    window.setTimeout(() => {
      setPosition(
        clampPosition(
          (560 - nextLocation.x) * scale,
          (310 - nextLocation.y) * scale,
        ),
      );
    }, 0);
  };

  const speakInstruction = (text: string, onEnd?: () => void) => {
    if (window.CCSAndroidBridge?.speak) {
      window.CCSAndroidBridge.speak(text);
      if (onEnd) {
        const timeoutId = window.setTimeout(
          onEnd,
          Math.max(1800, text.length * 72),
        );
        if (voiceQueueRef.current) {
          voiceQueueRef.current.timeoutId = timeoutId;
        }
      }
      return;
    }

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  const playCurrentVoiceInstruction = () => {
    const instruction = routeInstructions[activeInstructionIndex];
    if (!instruction) return;
    stopVoiceGuidance();
    speakInstruction(instruction.voicePrompt);
  };

  const playAllVoiceInstructions = (startIndex = 0, onComplete?: () => void) => {
    const prompts = routeInstructions
      .slice(startIndex)
      .map((instruction) => instruction.voicePrompt);
    if (prompts.length === 0) return;

    stopVoiceGuidance();
    voiceQueueRef.current = { prompts, index: 0, onComplete };

    const playNext = () => {
      const queue = voiceQueueRef.current;
      if (!queue) return;

      const prompt = queue.prompts[queue.index];
      if (!prompt) {
        const complete = queue.onComplete;
        voiceQueueRef.current = null;
        complete?.();
        return;
      }

      speakInstruction(prompt, () => {
        if (!voiceQueueRef.current) return;
        voiceQueueRef.current.index += 1;
        playNext();
      });
    };

    playNext();
  };

  const stopVoiceGuidance = () => {
    if (voiceQueueRef.current?.timeoutId) {
      window.clearTimeout(voiceQueueRef.current.timeoutId);
    }
    voiceQueueRef.current = null;
    window.CCSAndroidBridge?.stopSpeech?.();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const resetView = () => {
    setScale(0.58);
    setRotation(-8);
    setTilt(58);
    setPosition({ x: 0, y: 0 });
  };

  const focusCurrentLocation = () => {
    setSelectedFloor(currentLocation.floorId);
    window.setTimeout(() => {
      setPosition(
        clampPosition(
          (560 - currentLocation.x) * scale,
          (310 - currentLocation.y) * scale,
        ),
      );
    }, 0);
  };

  const clampPosition = (x: number, y: number) => {
    const viewport = constraintsRef.current?.getBoundingClientRect();
    if (!viewport) return { x, y };

    const scaledWidth = 1120 * scale;
    const scaledHeight = 620 * scale;
    const maxX = Math.max(120, scaledWidth / 2 - viewport.width / 2 + 170);
    const maxY = Math.max(180, scaledHeight / 2 - viewport.height / 2 + 360);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const updatePosition = (deltaX: number, deltaY: number) => {
    setPosition((current) =>
      clampPosition(current.x + deltaX, current.y + deltaY),
    );
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const first = touches[0];
    const second = touches[1];
    return Math.hypot(
      second.clientX - first.clientX,
      second.clientY - first.clientY,
    );
  };

  const getTouchAngle = (touches: React.TouchList) => {
    const first = touches[0];
    const second = touches[1];
    return (
      (Math.atan2(second.clientY - first.clientY, second.clientX - first.clientX) *
        180) /
      Math.PI
    );
  };

  const getTouchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const startMouseRotation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.button === 0 && !event.shiftKey) {
      mapPanRef.current = {
        active: true,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      };
      return;
    }

    if (event.button !== 2 && !event.shiftKey) return;

    mouseRotateRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    setIsGestureTransforming(true);
  };

  const rotateWithMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mapPanRef.current.active) {
      event.preventDefault();
      const deltaX = event.clientX - mapPanRef.current.lastX;
      const deltaY = event.clientY - mapPanRef.current.lastY;
      mapPanRef.current.lastX = event.clientX;
      mapPanRef.current.lastY = event.clientY;

      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
        mapPanRef.current.moved = true;
        suppressSelectRef.current = true;
      }

      updatePosition(deltaX, deltaY);
      return;
    }

    if (!mouseRotateRef.current.active) return;
    event.preventDefault();

    const deltaX = event.clientX - mouseRotateRef.current.lastX;
    const deltaY = event.clientY - mouseRotateRef.current.lastY;
    mouseRotateRef.current.lastX = event.clientX;
    mouseRotateRef.current.lastY = event.clientY;
    setRotation((value) => value + deltaX * 0.35);
    setTilt((value) => Math.max(38, Math.min(72, value + deltaY * 0.18)));
  };

  const stopMouseRotation = () => {
    if (mapPanRef.current.active) {
      mapPanRef.current.active = false;
      window.setTimeout(() => {
        suppressSelectRef.current = false;
      }, 120);
    }

    if (mouseRotateRef.current.active) {
      mouseRotateRef.current.active = false;
      setIsGestureTransforming(false);
    }
  };

  const startTouchPinch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      mapPanRef.current = {
        active: true,
        lastX: touch.clientX,
        lastY: touch.clientY,
        moved: false,
      };
      return;
    }

    if (event.touches.length !== 2) return;
    event.preventDefault();
    mapPanRef.current.active = false;
    touchPinchRef.current = {
      active: true,
      lastDistance: getTouchDistance(event.touches),
      lastAngle: getTouchAngle(event.touches),
      lastCenterX: getTouchCenter(event.touches).x,
      lastCenterY: getTouchCenter(event.touches).y,
      tiltPrimed: false,
    };
    suppressSelectRef.current = true;
    setIsGestureTransforming(true);
  };

  const zoomWithTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (mapPanRef.current.active && event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - mapPanRef.current.lastX;
      const deltaY = touch.clientY - mapPanRef.current.lastY;
      mapPanRef.current.lastX = touch.clientX;
      mapPanRef.current.lastY = touch.clientY;

      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
        mapPanRef.current.moved = true;
        suppressSelectRef.current = true;
      }

      updatePosition(deltaX, deltaY);
      return;
    }

    if (!touchPinchRef.current.active || event.touches.length !== 2) return;
    event.preventDefault();

    const nextDistance = getTouchDistance(event.touches);
    const nextAngle = getTouchAngle(event.touches);
    const nextCenter = getTouchCenter(event.touches);
    const distanceDelta = nextDistance - touchPinchRef.current.lastDistance;
    const angleDelta = nextAngle - touchPinchRef.current.lastAngle;
    const centerDeltaX = nextCenter.x - touchPinchRef.current.lastCenterX;
    const centerDeltaY = nextCenter.y - touchPinchRef.current.lastCenterY;

    touchPinchRef.current.lastDistance = nextDistance;
    touchPinchRef.current.lastAngle = nextAngle;
    touchPinchRef.current.lastCenterX = nextCenter.x;
    touchPinchRef.current.lastCenterY = nextCenter.y;

    setScale((value) =>
      Math.max(0.42, Math.min(1.45, value + distanceDelta * 0.003)),
    );

    if (Math.abs(angleDelta) > 0.35 && Math.abs(angleDelta) < 24) {
      setRotation((value) => value + angleDelta * 0.7);
    }

    const shouldTilt =
      touchPinchRef.current.tiltPrimed ||
      (Math.abs(centerDeltaY) > 2.5 &&
        Math.abs(centerDeltaY) > Math.abs(centerDeltaX) * 1.45 &&
        Math.abs(distanceDelta) < 9 &&
        Math.abs(angleDelta) < 6);

    if (shouldTilt) {
      touchPinchRef.current.tiltPrimed = true;
      setTilt((value) => Math.max(38, Math.min(72, value + centerDeltaY * 0.16)));
    }
  };

  const stopTouchPinch = () => {
    if (mapPanRef.current.active) {
      mapPanRef.current.active = false;
      window.setTimeout(() => {
        suppressSelectRef.current = false;
      }, 120);
    }

    if (touchPinchRef.current.active) {
      touchPinchRef.current.active = false;
      setIsGestureTransforming(false);
      window.setTimeout(() => {
        suppressSelectRef.current = false;
      }, 140);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        background: "linear-gradient(180deg, #FFFBEF 0%, #FFF0C4 100%)",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`
        .ccs-indoor-map * {
          box-sizing: border-box;
        }

        .ccs-indoor-map button {
          font: inherit;
          -webkit-tap-highlight-color: transparent;
        }

        .ccs-indoor-select {
          width: 100%;
          min-height: 46px;
          border: 1px solid rgba(102, 11, 5, 0.16);
          border-radius: 14px;
          background: #FFFBEF;
          color: #3E0703;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.2;
          padding: 0 40px 0 12px;
          appearance: none;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .ccs-indoor-floor-select {
          min-height: 54px;
          border-color: rgba(255, 240, 196, 0.26);
          background: linear-gradient(135deg, #3E0703 0%, #660B05 48%, #8C1007 100%);
          color: #FFF0C4;
          font-size: 15px;
          letter-spacing: 0.1px;
          box-shadow: 0 14px 28px rgba(62, 7, 3, 0.22);
        }

        .ccs-indoor-select option {
          color: #3E0703;
          background: #FFFBEF;
        }

        .ccs-indoor-search {
          width: 100%;
          min-height: 46px;
          border: 1px solid rgba(102, 11, 5, 0.16);
          border-radius: 14px;
          background: #FFFBEF;
          color: #3E0703;
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          padding: 0 12px 0 40px;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }
      `}</style>
      <div
        className="ccs-indoor-map"
        style={{
          width: "100%",
          minHeight: "100%",
          padding: "58px 12px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: c.darkBrown,
          fontFamily: fonts.ui,
        }}
      >
        <section
          style={{
            borderRadius: 18,
            background: "rgba(255, 251, 239, 0.94)",
            border: "1px solid rgba(102, 11, 5, 0.14)",
            boxShadow: shadow.card,
            padding: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.7,
              color: c.baseRed,
              textTransform: "uppercase",
            }}
          >
            Saint Benedict Hall
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 20,
              lineHeight: 1.15,
              color: "#3E0703",
            }}
          >
            Indoor Map Navigation
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              lineHeight: 1.45,
              color: c.warmGray,
            }}
          >
            {activeFloor.label}. Drag to pan. On mobile, pinch to zoom,
            twist to rotate, and move two fingers vertically to tilt.
          </p>
        </section>

        <section
          style={{
            borderRadius: 18,
            background: "rgba(255, 251, 239, 0.96)",
            border: "1px solid rgba(102, 11, 5, 0.14)",
            boxShadow: "0 10px 22px rgba(62, 7, 3, 0.1)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ position: "relative" }}>
            <Search
              size={17}
              color="#8C1007"
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              className="ccs-indoor-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search rooms, labs, offices..."
              aria-label="Search indoor rooms and facilities"
            />
          </div>

          {searchResults.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 6,
              }}
            >
              {searchResults.map((result) => (
                <button
                  key={`${result.floorId}-${result.room.id}`}
                  type="button"
                  onClick={() => focusRoom(result.floorId, result.room.id)}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(102, 11, 5, 0.12)",
                    background: "#FFFFFF",
                    color: "#3E0703",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "8px 10px",
                    textAlign: "left",
                    touchAction: "manipulation",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 850 }}>
                    {result.room.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#8C1007",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {result.floorLabel}
                  </span>
                </button>
              ))}
            </div>
          )}

          {normalizedSearch && searchResults.length === 0 && (
            <p
              style={{
                margin: 0,
                color: c.warmGray,
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              No rooms found for that search.
            </p>
          )}

          <div style={{ position: "relative" }}>
            <select
              className="ccs-indoor-select"
              value={activeCategory}
              onChange={(event) =>
                setActiveCategory(event.target.value as RoomCategory)
              }
              aria-label="Filter rooms by category"
            >
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  Filter: {category.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              color="#660B05"
              style={{
                position: "absolute",
                right: 13,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {!hasCategoryMatches && (
            <p
              style={{
                margin: 0,
                color: "#8C1007",
                fontSize: 12,
                fontWeight: 750,
              }}
            >
              No rooms found for this category on this floor.
            </p>
          )}
        </section>

        <section
          aria-label="Floor picker"
          style={{
            position: "relative",
            borderRadius: 18,
            padding: 10,
            background:
              "linear-gradient(145deg, rgba(255,251,239,0.98), rgba(255,240,196,0.94))",
            border: "1px solid rgba(102, 11, 5, 0.14)",
            boxShadow: "0 12px 24px rgba(62, 7, 3, 0.12)",
          }}
        >
          <p
            style={{
              margin: "0 0 7px",
              color: "#8C1007",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Choose Building Level
          </p>
          <div style={{ position: "relative" }}>
            <select
              className="ccs-indoor-select ccs-indoor-floor-select"
              value={selectedFloor}
              onChange={(event) => setSelectedFloor(event.target.value as FloorId)}
              aria-label="Choose floor"
            >
              {floorOptions.map((floor, index) => (
                <option key={floor.id} value={floor.id}>
                  Level {String(index + 1).padStart(2, "0")} - {floor.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={20}
              color="#FFF0C4"
              style={{
                position: "absolute",
                right: 13,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </section>

        <section
          ref={constraintsRef}
          onContextMenu={(event) => event.preventDefault()}
          onMouseDown={startMouseRotation}
          onMouseMove={rotateWithMouse}
          onMouseUp={stopMouseRotation}
          onMouseLeave={stopMouseRotation}
          onTouchStart={startTouchPinch}
          onTouchMove={zoomWithTouch}
          onTouchEnd={stopTouchPinch}
          onTouchCancel={stopTouchPinch}
          style={{
            position: "relative",
            width: "100%",
            height: "min(58dvh, 520px)",
            minHeight: 420,
            overflow: "hidden",
            borderRadius: 20,
            border: "1px solid rgba(62, 7, 3, 0.18)",
            background:
              "radial-gradient(circle at 50% 30%, #FFFBEF 0%, #F5E5BA 68%, #E9CE92 100%)",
            boxShadow: "0 18px 32px rgba(62, 7, 3, 0.18)",
            touchAction: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              zIndex: 5,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              maxWidth: "calc(100% - 20px)",
              pointerEvents: "none",
            }}
          >
            <ControlButton label="Zoom in" onClick={() => setScale((value) => Math.min(value + 0.1, 1.45))}>
              <Plus size={18} />
            </ControlButton>
            <ControlButton label="Zoom out" onClick={() => setScale((value) => Math.max(value - 0.1, 0.42))}>
              <Minus size={18} />
            </ControlButton>
          </div>

          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              zIndex: 5,
              display: "flex",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            <ControlButton label="Center blue pin" onClick={focusCurrentLocation}>
              <LocateFixed size={18} />
            </ControlButton>
            <ControlButton label="Reset view" onClick={resetView}>
              <Undo2 size={18} />
            </ControlButton>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 1120,
              height: 620,
              originX: 0.5,
              originY: 0.5,
              translateX: "-50%",
              translateY: "-50%",
              cursor: isGestureTransforming ? "move" : "grab",
              transformStyle: "preserve-3d",
              perspective: 1200,
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: mapPanRef.current.active || touchPinchRef.current.active
                ? "none"
                : "transform 0.16s ease-out",
            }}
          >
            <div
              style={{
                transform: `rotateX(${tilt}deg) rotateZ(${rotation}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedFloor}
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    height: "100%",
                    transformOrigin: "50% 50%",
                  }}
                >
                  <svg
                    viewBox="0 0 1120 620"
                    width="1120"
                    height="620"
                    aria-label={`${activeFloor.label} Saint Benedict Hall indoor map`}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      overflow: "visible",
                      filter: "drop-shadow(0 24px 24px rgba(62, 7, 3, 0.2))",
                    }}
                  >
                    <rect x="-45" y="35" width="1130" height="535" rx="10" fill="#F7E3AD" stroke="#3E0703" strokeWidth="8" />
                    <rect x="-10" y="175" width="1040" height="210" fill="#FFFBEF" stroke="#8C1007" strokeDasharray="8 8" strokeWidth="2" opacity="0.86" />
                    <text
                      x="560"
                      y="310"
                      textAnchor="middle"
                      style={{
                        fill: "#660B05",
                        fontFamily: fonts.ui,
                        fontSize: 34,
                        fontWeight: 900,
                        opacity: 0.18,
                      }}
                    >
                      {activeFloor.title}
                    </text>

                    <RoutePath points={routePoints} />

                    {rooms.map((room) => (
                      <IsoRoom
                        key={room.id}
                        room={room}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        canSelect={() => !suppressSelectRef.current}
                        dimmed={
                          activeCategory !== "all" &&
                          !filteredRoomIds.has(room.id)
                        }
                        isDestination={
                          navigationTarget?.floorId === selectedFloor &&
                          navigationTarget.roomId === room.id
                        }
                      />
                    ))}

                    {selectedFloor === activeRouteStart.floorId && (
                      <NavigationMarker
                        x={activeRouteStart.x}
                        y={activeRouteStart.y}
                        heading={activeRouteStart.heading - rotation}
                      />
                    )}

                    <g>
                      {rooms.map((room) => (
                        <RoomHitbox
                          key={`${room.id}-hitbox`}
                          room={room}
                          setSelectedId={setSelectedId}
                          canSelect={() => !suppressSelectRef.current}
                        />
                      ))}
                    </g>
                  </svg>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: 18,
            background: "#FFFBEF",
            border: "1px solid rgba(102, 11, 5, 0.14)",
            boxShadow: "0 10px 24px rgba(62, 7, 3, 0.1)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  color: "#8C1007",
                  textTransform: "uppercase",
                }}
              >
                Selected Area
              </p>
              <h2
                style={{
                  margin: "4px 0 0",
                  fontSize: 18,
                  lineHeight: 1.2,
                  color: "#3E0703",
                }}
              >
                {selected.name}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.warmGray }}>
                {roomTypeLabels[selected.type]}
              </p>
            </div>
            <p
              style={{
                margin: 0,
                flexShrink: 0,
                borderRadius: 999,
                background: "#FFF0C4",
                color: "#660B05",
                padding: "5px 8px",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {activeFloor.label}
            </p>
          </div>

          <div
            style={{
              position: "relative",
            }}
          >
            <select
              className="ccs-indoor-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              aria-label="Choose room or area"
            >
              {sortedRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {roomTypeLabels[room.type]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              color="#660B05"
              style={{
                position: "absolute",
                right: 13,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: navigationTarget ? "1fr 44px" : "1fr",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => startNavigation()}
              style={{
                minHeight: 44,
                borderRadius: 14,
                border: "1px solid rgba(140, 16, 7, 0.22)",
                background:
                  "linear-gradient(135deg, #660B05 0%, #8C1007 100%)",
                color: "#FFF0C4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 900,
                touchAction: "manipulation",
                boxShadow: "0 10px 18px rgba(140, 16, 7, 0.2)",
              }}
            >
              <Navigation size={16} />
              Navigate to Selected Area
            </button>
            {navigationTarget && (
              <button
                type="button"
                onClick={clearNavigation}
                aria-label="Clear navigation route"
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(102, 11, 5, 0.16)",
                  background: "#FFFBEF",
                  color: "#8C1007",
                  display: "grid",
                  placeItems: "center",
                  touchAction: "manipulation",
                }}
              >
                <X size={17} />
              </button>
            )}
          </div>

          {navigationTarget && navigationTargetRoom && routeInstructions.length > 0 && (
            <div
              style={{
                borderRadius: 12,
                background: "rgba(255, 240, 196, 0.8)",
                border: "1px solid rgba(140, 16, 7, 0.14)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#8C1007",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  Route Guidance
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    color: "#3E0703",
                    fontSize: 13,
                    fontWeight: 850,
                    lineHeight: 1.35,
                  }}
                >
                  Route to {navigationTargetRoom.name}
                  {navigationTarget.floorId !== activeRouteStart.floorId
                    ? ` via ${
                        getTransitionRoom(floorConfigs[activeRouteStart.floorId].rooms)
                          .name
                      }`
                    : ""}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {routeInstructions.map((instruction, index) => {
                  const active = index === activeInstructionIndex;

                  return (
                    <div
                      key={instruction.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "26px 1fr",
                        gap: 8,
                        alignItems: "flex-start",
                        borderRadius: 11,
                        background: active ? "#FFFBEF" : "rgba(255,255,255,0.48)",
                        border: active
                          ? "1px solid rgba(140, 16, 7, 0.2)"
                          : "1px solid rgba(102, 11, 5, 0.08)",
                        padding: "8px 9px",
                        boxShadow: active
                          ? "0 8px 16px rgba(140, 16, 7, 0.11)"
                          : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: active ? "#8C1007" : "#FFF0C4",
                          color: active ? "#FFF0C4" : "#660B05",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span>
                        <span
                          style={{
                            display: "block",
                            color: "#3E0703",
                            fontSize: 12,
                            fontWeight: 900,
                            lineHeight: 1.25,
                          }}
                        >
                          {instruction.title}
                        </span>
                        <span
                          style={{
                            display: "block",
                            color: c.warmGray,
                            fontSize: 11,
                            fontWeight: 650,
                            lineHeight: 1.35,
                            marginTop: 2,
                          }}
                        >
                          {instruction.detail}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 44px",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={playCurrentVoiceInstruction}
                  style={{
                    minHeight: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(140, 16, 7, 0.2)",
                    background: "#FFFBEF",
                    color: "#660B05",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    touchAction: "manipulation",
                  }}
                >
                  <Volume2 size={15} />
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => playAllVoiceInstructions(0, completeNavigation)}
                  style={{
                    minHeight: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(140, 16, 7, 0.24)",
                    background:
                      "linear-gradient(135deg, #660B05 0%, #8C1007 100%)",
                    color: "#FFF0C4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    touchAction: "manipulation",
                  }}
                >
                  <PlayCircle size={15} />
                  All
                </button>
                <button
                  type="button"
                  onClick={stopVoiceGuidance}
                  aria-label="Stop voice guidance"
                  style={{
                    minHeight: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(102, 11, 5, 0.16)",
                    background: "#FFFBEF",
                    color: "#8C1007",
                    display: "grid",
                    placeItems: "center",
                    touchAction: "manipulation",
                  }}
                >
                  <PauseCircle size={17} />
                </button>
              </div>

              <button
                type="button"
                onClick={completeNavigation}
                style={{
                  minHeight: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(29, 78, 216, 0.24)",
                  background: "rgba(29, 78, 216, 0.1)",
                  color: "#1D4ED8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 900,
                  touchAction: "manipulation",
                }}
              >
                <LocateFixed size={15} />
                Mark Arrived and Set as Start Point
              </button>

              <p
                style={{
                  margin: 0,
                  color: "#660B05",
                  fontSize: 11,
                  fontWeight: 750,
                  lineHeight: 1.35,
                }}
              >
                The blue pin is the current start point. Mark arrival after a
                successful route to use this destination as the next starting
                point.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
