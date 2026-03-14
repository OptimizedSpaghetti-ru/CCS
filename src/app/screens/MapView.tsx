import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AnimatePresence, motion } from "motion/react";
import { Navigation, ChevronDown, Map as MapIcon, Radio } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";

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
type BuildingFloor =
  | "1st-floor"
  | "2nd-floor"
  | "3rd-floor"
  | "4th-floor"
  | "5th-floor";
/* ── OLFU CAMPUS ── */
const OLFU_CENTER: [number, number] = [14.679975, 120.981499];

const DEFAULT_ZOOM = 17;
const MIN_ZOOM = 16;

const MAX_BOUNDS: [[number, number], [number, number]] = [
  [14.678975, 120.980499],
  [14.680975, 120.982499],
];

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

const buildingFloors: Array<{ value: BuildingFloor; label: string }> = [
  { value: "1st-floor", label: "1st Floor" },
  { value: "2nd-floor", label: "2nd Floor" },
  { value: "3rd-floor", label: "3rd Floor" },
  { value: "4th-floor", label: "4th Floor" },
  { value: "5th-floor", label: "5th Floor" },
];

/* ── Component ── */
export function MapView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MapTab>("realtime");
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [selectedFloor, setSelectedFloor] =
    useState<BuildingFloor>("1st-floor");
  const [isFloorImageMissing, setIsFloorImageMissing] = useState(false);
  const [isFloorImageLoading, setIsFloorImageLoading] = useState(true);

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
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const geoLocations = locations.filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  const selectedFloorImage = `/building-maps/saint-benedict-hall/${selectedFloor}.png`;

  useEffect(() => {
    setIsFloorImageMissing(false);
    setIsFloorImageLoading(true);
  }, [selectedFloor]);

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
              center={userPos ?? OLFU_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={MIN_ZOOM}
              maxBounds={MAX_BOUNDS}
              maxBoundsViscosity={1.0}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

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
          <div
            style={{ position: "absolute", inset: 0, background: c.creamLight }}
          >
            <motion.div
              style={{
                position: "relative",
                zIndex: 10,
                padding: "52px 14px 0",
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
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    fontWeight: 700,
                    color: c.darkBrown,
                  }}
                >
                  Saint Benedict Hall Building
                </p>
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
              </div>
            </motion.div>

            <motion.div
              style={{
                position: "absolute",
                top: 160,
                left: 14,
                right: 14,
                bottom: 90,
                background: c.white,
                borderRadius: 16,
                boxShadow: shadow.card,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: 0.03 }}
            >
              <AnimatePresence mode="wait">
                {isFloorImageMissing ? (
                  <motion.p
                    key="missing-floor-image"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{
                      margin: 0,
                      padding: "0 16px",
                      textAlign: "center",
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      color: c.warmGray,
                      lineHeight: 1.5,
                    }}
                  >
                    No image found for this floor yet.
                  </motion.p>
                ) : (
                  <motion.img
                    key={selectedFloorImage}
                    src={selectedFloorImage}
                    alt={`Saint Benedict Hall Building ${buildingFloors.find((floor) => floor.value === selectedFloor)?.label}`}
                    onLoad={() => setIsFloorImageLoading(false)}
                    onError={() => {
                      setIsFloorImageLoading(false);
                      setIsFloorImageMissing(true);
                    }}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{
                      opacity: isFloorImageLoading ? 0 : 1,
                      scale: isFloorImageLoading ? 0.985 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: c.creamLight,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
