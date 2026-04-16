import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-rotate";
import { motion } from "motion/react";
import {
  Navigation,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  Radio,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import buildingMapData from "../../data/buildingMapData";

/* ── Types ── */
interface MapLocation {
  id: string;
  name: string;
  category: string;
  floor: string;
  building: string;
  color: string;
  latitude: number | null;
  longitude: number | null;
}

type MapTab = "realtime" | "building";
type BuildingId = "saint-benedict-hall" | "pope-john-paul-building";
type BuildingMapMode = "interactive" | "image";

type BuildingFloor =
  | "1st-floor"
  | "2nd-floor"
  | "3rd-floor"
  | "4th-floor"
  | "5th-floor";

type RoomCategory = "lab" | "classroom" | "office" | "facility" | "faculty";
type RoomCategoryFilter = RoomCategory | "all";

interface BuildingRoom {
  id: string;
  name: string;
  category: RoomCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  hours: string;
}

const categoryMeta: Record<
  RoomCategory,
  {
    label: string;
    fill: string;
    stroke: string;
    badgeText: string;
    badgeBg: string;
  }
> = {
  lab: {
    label: "Lab",
    fill: "#bfdbfe",
    stroke: "#3b82f6",
    badgeText: "#1d4ed8",
    badgeBg: "#dbeafe",
  },
  classroom: {
    label: "Classroom",
    fill: "#bbf7d0",
    stroke: "#22c55e",
    badgeText: "#166534",
    badgeBg: "#dcfce7",
  },
  office: {
    label: "Office",
    fill: "#fde68a",
    stroke: "#f59e0b",
    badgeText: "#92400e",
    badgeBg: "#fef3c7",
  },
  facility: {
    label: "Facility",
    fill: "#fecaca",
    stroke: "#ef4444",
    badgeText: "#991b1b",
    badgeBg: "#fee2e2",
  },
  faculty: {
    label: "Faculty",
    fill: "#e9d5ff",
    stroke: "#a855f7",
    badgeText: "#581c87",
    badgeBg: "#f3e8ff",
  },
};

const categoryFilters: Array<{ value: RoomCategoryFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "lab", label: "Lab" },
  { value: "classroom", label: "Classroom" },
  { value: "office", label: "Office" },
  { value: "facility", label: "Facility" },
  { value: "faculty", label: "Faculty" },
];

const floorRoomMap = buildingMapData as Record<BuildingFloor, BuildingRoom[]>;

function splitRoomLabel(name: string, roomWidth: number) {
  const maxCharsPerLine = Math.max(6, Math.floor((roomWidth - 8) / 5.4));
  const words = name.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      return;
    }

    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.slice(0, 3);
}
/* ── OLFU CAMPUS ── */
const OLFU_CENTER: [number, number] = [14.679975, 120.981499];
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [14.6784, 120.9799],
  [14.6816, 120.9831],
];

const DEFAULT_ZOOM = 17;
const MIN_ZOOM = DEFAULT_ZOOM;

const CAMPUS_BOUNDS_OBJ = L.latLngBounds(CAMPUS_BOUNDS);

/* ── Custom map marker ── */
function createMarkerIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

/* ── User location marker ── */
const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#1D4ED8;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/* ── Recenter helper ── */
function RecenterButton({ position }: { position: [number, number] | null }) {
  const map = useMap();
  if (!position) return null;
  return (
    <button
      onClick={() => map.flyTo(position, DEFAULT_ZOOM, { duration: 0.8 })}
      style={{
        position: "absolute",
        right: 14,
        bottom: 300,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: c.white,
        border: "none",
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Navigation size={20} color={c.baseRed} />
    </button>
  );
}

function BoundsEnforcer() {
  const map = useMapEvents({
    moveend() {
      if (
        map.getZoom() <= DEFAULT_ZOOM &&
        !CAMPUS_BOUNDS_OBJ.contains(map.getCenter())
      ) {
        map.panInsideBounds(CAMPUS_BOUNDS_OBJ, { animate: false });
      }
    },
    zoomend() {
      (map.options as any).maxBoundsViscosity =
        map.getZoom() > DEFAULT_ZOOM ? 0.2 : 1.0;

      if (
        map.getZoom() <= DEFAULT_ZOOM &&
        !CAMPUS_BOUNDS_OBJ.contains(map.getCenter())
      ) {
        map.panInsideBounds(CAMPUS_BOUNDS_OBJ, { animate: false });
      }
    },
  });

  useEffect(() => {
    const enforceBounds = () => {
      if (
        map.getZoom() <= DEFAULT_ZOOM &&
        !CAMPUS_BOUNDS_OBJ.contains(map.getCenter())
      ) {
        map.panInsideBounds(CAMPUS_BOUNDS_OBJ, { animate: false });
      }
    };

    map.on("rotate" as any, enforceBounds);
    map.setMaxBounds(CAMPUS_BOUNDS_OBJ);
    (map.options as any).maxBoundsViscosity =
      map.getZoom() > DEFAULT_ZOOM ? 0.2 : 1.0;

    enforceBounds();

    return () => {
      map.off("rotate" as any, enforceBounds);
    };
  }, [map]);

  return null;
}

const buildingFloors: Array<{ value: BuildingFloor; label: string }> = [
  { value: "1st-floor", label: "1st Floor" },
  { value: "2nd-floor", label: "2nd Floor" },
  { value: "3rd-floor", label: "3rd Floor" },
  { value: "4th-floor", label: "4th Floor" },
  { value: "5th-floor", label: "5th Floor" },
];

const buildingOptions: Array<{ value: BuildingId; label: string }> = [
  { value: "saint-benedict-hall", label: "Saint Benedict Hall Building" },
  { value: "pope-john-paul-building", label: "Pope John Paul Building" },
];

/* ── Component ── */
export function MapView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MapTab>("realtime");
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hasAutoCenteredToUser = useRef(false);
  const [activeBuilding, setActiveBuilding] = useState<BuildingId>(
    "saint-benedict-hall",
  );
  const [mapMode, setMapMode] = useState<BuildingMapMode>("interactive");
  const [selectedFloor, setSelectedFloor] =
    useState<BuildingFloor>("1st-floor");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<RoomCategoryFilter>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDetailThumbnailMissing, setIsDetailThumbnailMissing] =
    useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const rotateOptions = {
    rotate: true,
    touchRotate: true,
    shiftKeyRotate: true,
    rotateControl: { position: "topright" },
  };

  /* Load locations from Supabase */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campus_locations")
        .select(
          "id, name, category, floor, building, color, latitude, longitude",
        )
        .order("name");
      if (data) {
        setLocations(
          data.map((r: any) => ({
            id: String(r.id),
            name: r.name ?? "",
            category: r.category ?? "",
            floor: r.floor ?? "",
            building: r.building ?? "",
            color: r.color ?? c.baseRed,
            latitude: r.latitude ?? null,
            longitude: r.longitude ?? null,
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  /* Get user geolocation */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserPos(coords);

        if (mapRef.current && !hasAutoCenteredToUser.current) {
          mapRef.current.flyTo(coords, DEFAULT_ZOOM, { duration: 0.8 });
          hasAutoCenteredToUser.current = true;
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const geoLocations = locations.filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  const selectedFloorImage = `/building-maps/${activeBuilding}/${selectedFloor}.png`;

  const activeBuildingConfig =
    buildingOptions.find((building) => building.value === activeBuilding) ??
    buildingOptions[0];

  const hasSaintBenedictMap = activeBuilding === "saint-benedict-hall";
  const isInteractiveMode = mapMode === "interactive";
  const roomInteractionsEnabled = isInteractiveMode && hasSaintBenedictMap;

  const floorRooms = useMemo(
    () => (hasSaintBenedictMap ? (floorRoomMap[selectedFloor] ?? []) : []),
    [selectedFloor, hasSaintBenedictMap],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredRooms = useMemo(
    () =>
      floorRooms.filter((room) => {
        const categoryPass =
          activeCategory === "all" || room.category === activeCategory;
        const queryPass =
          normalizedQuery.length === 0 ||
          room.name.toLowerCase().includes(normalizedQuery);
        return categoryPass && queryPass;
      }),
    [floorRooms, activeCategory, normalizedQuery],
  );

  const filteredRoomIds = useMemo(
    () => new Set(filteredRooms.map((room) => room.id)),
    [filteredRooms],
  );

  const selectedRoom = useMemo(
    () => floorRooms.find((room) => room.id === selectedRoomId) ?? null,
    [floorRooms, selectedRoomId],
  );

  const selectedFloorLabel = useMemo(
    () =>
      buildingFloors.find((floor) => floor.value === selectedFloor)?.label ??
      "Floor",
    [selectedFloor],
  );

  const switchBuilding = (direction: -1 | 1) => {
    const currentIndex = buildingOptions.findIndex(
      (building) => building.value === activeBuilding,
    );
    const nextIndex =
      (currentIndex + direction + buildingOptions.length) %
      buildingOptions.length;
    setActiveBuilding(buildingOptions[nextIndex].value);
  };

  useEffect(() => {
    setSelectedRoomId(null);
  }, [selectedFloor, activeBuilding, mapMode]);

  useEffect(() => {
    setIsDetailThumbnailMissing(false);
  }, [selectedFloor, activeBuilding, mapMode]);

  useEffect(() => {
    if (!selectedRoomId || !detailsRef.current) return;
    detailsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedRoomId]);

  /* ── Tab pill style ── */
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: "8px 0",
    fontFamily: fonts.ui,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "all 0.2s",
    background: active ? g.button : "transparent",
    color: active ? c.cream : c.warmGray,
    boxShadow: active ? shadow.button : "none",
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "calc(100vh - 70px)",
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Tab switcher overlay ── */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: 240,
          display: "flex",
          background: c.white,
          borderRadius: 12,
          padding: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setActiveTab("realtime")}
          style={tabStyle(activeTab === "realtime")}
        >
          <Radio size={14} />
          Realtime Map
        </button>
        <button
          onClick={() => setActiveTab("building")}
          style={tabStyle(activeTab === "building")}
        >
          <MapIcon size={14} />
          Building Map
        </button>
      </div>

      {/* ═══════════════ REALTIME MAP ═══════════════ */}
      {activeTab === "realtime" && (
        <>
          {/* Leaflet map — full screen behind overlays */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <MapContainer
              ref={mapRef}
              center={OLFU_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={MIN_ZOOM}
              maxBounds={CAMPUS_BOUNDS}
              maxBoundsViscosity={1.0}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              attributionControl={false}
              {...(rotateOptions as any)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              <BoundsEnforcer />

              {/* Location markers */}
              {geoLocations.map((loc) => (
                <Marker
                  key={loc.id}
                  position={[loc.latitude!, loc.longitude!]}
                  icon={createMarkerIcon(loc.color)}
                >
                  <Popup>
                    <div style={{ fontFamily: fonts.ui, minWidth: 140 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: c.darkBrown,
                        }}
                      >
                        {loc.name}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 11,
                          color: c.warmGray,
                        }}
                      >
                        {loc.floor}
                        {loc.floor && loc.building ? " · " : ""}
                        {loc.building}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          color: loc.color,
                          background: `${loc.color}15`,
                          borderRadius: 20,
                          padding: "1px 8px",
                        }}
                      >
                        {loc.category}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User position marker */}
              {userPos && (
                <Marker position={userPos} icon={userIcon}>
                  <Popup>
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Your Location
                    </span>
                  </Popup>
                </Marker>
              )}

              <RecenterButton position={userPos ?? OLFU_CENTER} />
            </MapContainer>
          </div>
        </>
      )}

      {/* ═══════════════ BUILDING MAP ═════ */}
      {activeTab === "building" && (
        <>
          <style>{`
            .mapview-building-filters {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }

            .mapview-filter-btn {
              border: 1px solid rgba(139,115,85,0.24);
              border-radius: 999px;
              background: ${c.white};
              color: ${c.warmGray};
              font-family: ${fonts.ui};
              font-size: 11px;
              font-weight: 600;
              padding: 5px 10px;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .mapview-filter-btn:hover {
              border-color: rgba(139,115,85,0.42);
              color: ${c.darkBrown};
            }

            .mapview-filter-btn.is-active {
              border-color: transparent;
              background: ${c.darkBrown};
              color: ${c.cream};
            }

            .mapview-building-header-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
            }

            .mapview-building-switch-btn {
              width: 28px;
              height: 28px;
              border: 1px solid rgba(139,115,85,0.24);
              border-radius: 999px;
              background: ${c.cream};
              display: inline-flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              flex-shrink: 0;
            }

            .mapview-map-mode-switch {
              display: flex;
              align-items: center;
              gap: 6px;
              width: 100%;
              background: ${c.cream};
              border: 1px solid rgba(139,115,85,0.18);
              border-radius: 12px;
              padding: 4px;
            }

            .mapview-map-mode-btn {
              flex: 1;
              border: none;
              border-radius: 9px;
              background: transparent;
              color: ${c.warmGray};
              font-family: ${fonts.ui};
              font-size: 12px;
              font-weight: 700;
              padding: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .mapview-map-mode-btn.is-active {
              background: ${c.white};
              color: ${c.darkBrown};
              box-shadow: inset 0 0 0 1px rgba(139,115,85,0.2);
            }

            .mapview-building-main {
              display: flex;
              flex-direction: column;
              gap: 12px;
              width: 100%;
            }

            .mapview-map-shell {
              background: ${c.creamLight};
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid rgba(139,115,85,0.16);
              width: 100%;
              min-height: clamp(240px, 38vh, 320px);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .mapview-map-shell svg {
              display: block;
              width: 100%;
              height: auto;
            }

            .mapview-building-room-list {
              width: 100%;
              max-height: min(220px, 30vh);
              overflow-y: auto;
            }

            .mapview-detail-sheet {
              background: ${c.cream};
              border-radius: 14px;
              border: 1px solid rgba(139,115,85,0.16);
              overflow: hidden;
              transition: max-height 0.28s ease, min-height 0.28s ease;
              box-shadow: 0 -3px 16px rgba(0,0,0,0.06);
              width: 100%;
            }
          `}</style>
          <div
            style={{ position: "absolute", inset: 0, background: c.creamLight }}
          >
            <motion.div
              style={{
                position: "relative",
                zIndex: 10,
                padding: "52px 14px 90px",
                height: "100%",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div
                style={{
                  background: c.white,
                  borderRadius: 14,
                  padding: "12px 14px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.darkBrown,
                  }}
                >
                  <div className="mapview-building-header-row">
                    <button
                      className="mapview-building-switch-btn"
                      onClick={() => switchBuilding(-1)}
                      aria-label="Previous building"
                    >
                      <ChevronLeft size={14} color={c.darkBrown} />
                    </button>
                    <span>{activeBuildingConfig.label}</span>
                    <button
                      className="mapview-building-switch-btn"
                      onClick={() => switchBuilding(1)}
                      aria-label="Next building"
                    >
                      <ChevronRight size={14} color={c.darkBrown} />
                    </button>
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <select
                    value={selectedFloor}
                    onChange={(event) =>
                      setSelectedFloor(event.target.value as BuildingFloor)
                    }
                    style={{
                      width: "100%",
                      height: 42,
                      borderRadius: 10,
                      border: "1px solid rgba(139,115,85,0.24)",
                      background: c.cream,
                      padding: "0 36px 0 12px",
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.darkBrown,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    {buildingFloors.map((floor) => (
                      <option key={floor.value} value={floor.value}>
                        {floor.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color={c.warmGray}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search rooms..."
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 10,
                    border: "1px solid rgba(139,115,85,0.24)",
                    background: c.white,
                    padding: "0 12px",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.darkBrown,
                    outline: "none",
                  }}
                />
                <div className="mapview-building-filters">
                  {categoryFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setActiveCategory(filter.value)}
                      className={`mapview-filter-btn ${activeCategory === filter.value ? "is-active" : ""}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                style={{
                  background: c.white,
                  borderRadius: 16,
                  boxShadow: shadow.card,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  padding: 12,
                  gap: 14,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: 0.03 }}
              >
                <div className="mapview-building-main">
                  <div className="mapview-map-shell">
                    {isInteractiveMode ? (
                      hasSaintBenedictMap ? (
                        <svg
                          viewBox="0 0 700 370"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            background: c.creamLight,
                          }}
                        >
                          <rect
                            x={20}
                            y={118}
                            width={660}
                            height={16}
                            fill="#cbd5e1"
                            rx={2}
                          />
                          <rect
                            x={20}
                            y={226}
                            width={660}
                            height={12}
                            fill="#cbd5e1"
                            rx={2}
                          />
                          <rect
                            x={20}
                            y={148}
                            width={660}
                            height={72}
                            fill="#f8fafc"
                            rx={2}
                          />
                          <text
                            x={350}
                            y={192}
                            textAnchor="middle"
                            fontSize={20}
                            fontWeight={700}
                            fill="#1e3a5f"
                            opacity={0.12}
                            fontFamily={fonts.ui}
                          >
                            ST. BENEDICT HALL -{" "}
                            {selectedFloorLabel.toUpperCase()}
                          </text>

                          {floorRooms.map((room) => {
                            const meta = categoryMeta[room.category];
                            const isSelected = selectedRoomId === room.id;
                            const isVisible = filteredRoomIds.has(room.id);
                            const lines = splitRoomLabel(room.name, room.width);
                            const fontSize =
                              room.width < 60 ? 8 : room.width < 80 ? 9 : 10;
                            const lineHeight = fontSize + 3;
                            const blockHeight = lines.length * lineHeight;
                            const startY =
                              room.y +
                              room.height / 2 -
                              blockHeight / 2 +
                              fontSize;

                            return (
                              <g
                                key={room.id}
                                style={{
                                  cursor: "pointer",
                                  opacity: isVisible ? 1 : 0.2,
                                }}
                                onClick={() => setSelectedRoomId(room.id)}
                              >
                                <rect
                                  x={room.x}
                                  y={room.y}
                                  width={room.width}
                                  height={room.height}
                                  fill={meta.fill}
                                  stroke={isSelected ? "#f59e0b" : meta.stroke}
                                  strokeWidth={isSelected ? 3 : 1.2}
                                  rx={4}
                                />
                                {lines.map((line, index) => (
                                  <text
                                    key={`${room.id}-${line}-${index}`}
                                    x={room.x + room.width / 2}
                                    y={startY + index * lineHeight}
                                    textAnchor="middle"
                                    fontSize={fontSize}
                                    fontWeight={600}
                                    fill={meta.stroke}
                                    fontFamily={fonts.ui}
                                  >
                                    {line}
                                  </text>
                                ))}
                              </g>
                            );
                          })}
                        </svg>
                      ) : (
                        <div
                          style={{
                            padding: 16,
                            textAlign: "center",
                            fontFamily: fonts.ui,
                            color: c.warmGray,
                          }}
                        >
                          {activeBuildingConfig.label} interactive map is not
                          yet available.
                        </div>
                      )
                    ) : hasSaintBenedictMap ? (
                      !isDetailThumbnailMissing ? (
                        <img
                          src={selectedFloorImage}
                          alt={`${activeBuildingConfig.label} ${selectedFloorLabel} image map`}
                          onError={() => setIsDetailThumbnailMissing(true)}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            background: c.creamLight,
                          }}
                        />
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            padding: "0 16px",
                            textAlign: "center",
                            fontFamily: fonts.ui,
                            fontSize: 12,
                            color: c.warmGray,
                          }}
                        >
                          Image map is not available for this floor.
                        </p>
                      )
                    ) : (
                      <div
                        style={{
                          padding: 16,
                          textAlign: "center",
                          fontFamily: fonts.ui,
                          color: c.warmGray,
                        }}
                      >
                        {activeBuildingConfig.label} image map is not yet
                        available.
                      </div>
                    )}
                  </div>

                  <div className="mapview-map-mode-switch">
                    <button
                      className={`mapview-map-mode-btn ${mapMode === "interactive" ? "is-active" : ""}`}
                      onClick={() => setMapMode("interactive")}
                    >
                      Interactive Map
                    </button>
                    <button
                      className={`mapview-map-mode-btn ${mapMode === "image" ? "is-active" : ""}`}
                      onClick={() => setMapMode("image")}
                    >
                      Image Map
                    </button>
                  </div>

                  <div
                    ref={detailsRef}
                    className="mapview-detail-sheet"
                    style={{
                      minHeight: selectedRoom ? 170 : 120,
                      maxHeight: selectedRoom ? 300 : 150,
                    }}
                  >
                    {roomInteractionsEnabled && selectedRoom ? (
                      <div
                        style={{
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          overflowY: "auto",
                          height: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontFamily: fonts.ui,
                                fontSize: 14,
                                fontWeight: 700,
                                color: c.darkBrown,
                              }}
                            >
                              {selectedRoom.name}
                            </p>
                            <p
                              style={{
                                margin: "3px 0 0",
                                fontFamily: fonts.ui,
                                fontSize: 12,
                                color: c.warmGray,
                              }}
                            >
                              {selectedRoom.description}
                            </p>
                          </div>
                          <span
                            style={{
                              display: "inline-block",
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color:
                                categoryMeta[selectedRoom.category].badgeText,
                              background:
                                categoryMeta[selectedRoom.category].badgeBg,
                              borderRadius: 999,
                              padding: "2px 8px",
                              height: "fit-content",
                            }}
                          >
                            {categoryMeta[selectedRoom.category].label}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            fontFamily: fonts.ui,
                            fontSize: 11,
                            color: c.warmGray,
                          }}
                        >
                          Hours: {selectedRoom.hours}
                        </p>
                      </div>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          padding: "10px 12px",
                          fontFamily: fonts.ui,
                          fontSize: 12,
                          color: c.warmGray,
                          lineHeight: 1.5,
                        }}
                      >
                        {mapMode === "image"
                          ? "Image map mode active. Switch to Interactive Map to select rooms."
                          : hasSaintBenedictMap
                            ? "Select a room from the map or list to view details."
                            : "Room details will be available after this building map is integrated."}
                      </p>
                    )}
                  </div>

                  <div
                    className="mapview-building-room-list"
                    style={{
                      background: c.cream,
                      borderRadius: 12,
                      border: "1px solid rgba(139,115,85,0.16)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 180,
                    }}
                  >
                    <div
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid rgba(139,115,85,0.12)",
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        fontWeight: 700,
                        color: c.darkBrown,
                      }}
                    >
                      Rooms ({filteredRooms.length})
                    </div>
                    <div style={{ overflowY: "auto" }}>
                      {filteredRooms.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            padding: "14px 12px",
                            fontFamily: fonts.ui,
                            fontSize: 12,
                            color: c.warmGray,
                          }}
                        >
                          No matching rooms.
                        </p>
                      ) : (
                        filteredRooms.map((room) => {
                          const meta = categoryMeta[room.category];
                          const isSelected = selectedRoomId === room.id;
                          return (
                            <button
                              key={room.id}
                              disabled={!roomInteractionsEnabled}
                              onClick={() => {
                                if (!roomInteractionsEnabled) return;
                                setSelectedRoomId(room.id);
                              }}
                              style={{
                                width: "100%",
                                border: "none",
                                borderBottom: "1px solid rgba(139,115,85,0.1)",
                                background: isSelected
                                  ? "rgba(245,166,35,0.12)"
                                  : "transparent",
                                cursor: roomInteractionsEnabled
                                  ? "pointer"
                                  : "default",
                                opacity: roomInteractionsEnabled ? 1 : 0.7,
                                textAlign: "left",
                                padding: "9px 12px",
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontFamily: fonts.ui,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: c.darkBrown,
                                }}
                              >
                                {room.name}
                              </p>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  color: c.warmGray,
                                  lineHeight: 1.4,
                                }}
                              >
                                {room.description}
                              </p>
                              <span
                                style={{
                                  display: "inline-block",
                                  marginTop: 5,
                                  fontFamily: fonts.ui,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: meta.badgeText,
                                  background: meta.badgeBg,
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                }}
                              >
                                {meta.label}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
