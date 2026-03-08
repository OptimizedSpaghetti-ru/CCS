import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Search,
  Navigation,
  ChevronRight,
  BookOpen,
  Laptop,
  Building2,
  School,
  UtensilsCrossed,
  Map as MapIcon,
  Radio,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";

/* ── Types ── */
type LocationIconKey = "library" | "lab" | "office" | "classroom" | "canteen";

interface MapLocation {
  id: string;
  name: string;
  category: string;
  floor: string;
  building: string;
  iconKey: LocationIconKey;
  color: string;
  latitude: number | null;
  longitude: number | null;
}

type MapTab = "realtime" | "building";
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

/* ── SVG Campus Map (Building Map placeholder) ── */
function CampusMap({ selectedId }: { selectedId: string | null }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 390 320"
      fill="none"
      style={{ display: "block" }}
    >
      <rect width="390" height="320" fill="#E8F5E9" />
      <rect
        x="140"
        y="0"
        width="30"
        height="320"
        fill="#F5F5F5"
        opacity="0.8"
      />
      <rect
        x="0"
        y="130"
        width="390"
        height="28"
        fill="#F5F5F5"
        opacity="0.8"
      />
      <rect
        x="240"
        y="0"
        width="22"
        height="320"
        fill="#F5F5F5"
        opacity="0.6"
      />
      <rect
        x="10"
        y="10"
        width="120"
        height="110"
        rx="8"
        fill="#C8E6C9"
        opacity="0.7"
      />
      <ellipse cx="60" cy="60" rx="30" ry="25" fill="#A5D6A7" opacity="0.5" />
      <ellipse cx="100" cy="80" rx="20" ry="18" fill="#A5D6A7" opacity="0.4" />
      <rect
        x="10"
        y="165"
        width="120"
        height="65"
        rx="6"
        fill="#7C3AED"
        opacity={selectedId === "1" ? 1 : 0.75}
      />
      <text
        x="70"
        y="195"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="600"
      >
        Main Library
      </text>
      <text
        x="70"
        y="207"
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize="8"
      >
        Ground Floor
      </text>
      <rect
        x="170"
        y="10"
        width="60"
        height="110"
        rx="6"
        fill="#059669"
        opacity={selectedId === "2" ? 1 : 0.75}
      />
      <text
        x="200"
        y="52"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        ICT
      </text>
      <text
        x="200"
        y="63"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Building
      </text>
      <rect
        x="272"
        y="10"
        width="108"
        height="110"
        rx="6"
        fill="#8C1007"
        opacity={selectedId === "3" || selectedId === "4" ? 1 : 0.75}
      />
      <text
        x="326"
        y="52"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Technology
      </text>
      <text
        x="326"
        y="63"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Building
      </text>
      <rect
        x="170"
        y="165"
        width="95"
        height="65"
        rx="6"
        fill="#D97706"
        opacity={0.75}
      />
      <text
        x="217"
        y="195"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Academic
      </text>
      <text
        x="217"
        y="206"
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontSize="8"
      >
        Building
      </text>
      <rect
        x="272"
        y="165"
        width="108"
        height="65"
        rx="6"
        fill="#1D4ED8"
        opacity={0.75}
      />
      <text
        x="326"
        y="195"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Main
      </text>
      <text
        x="326"
        y="206"
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontSize="8"
      >
        Building
      </text>
      <rect
        x="10"
        y="250"
        width="120"
        height="60"
        rx="6"
        fill="#374151"
        opacity={0.75}
      />
      <text
        x="70"
        y="278"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Admin
      </text>
      <text
        x="70"
        y="289"
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontSize="8"
      >
        Building
      </text>
      <rect
        x="170"
        y="250"
        width="95"
        height="60"
        rx="6"
        fill="#EA4335"
        opacity={selectedId === "5" ? 1 : 0.75}
      />
      <text
        x="217"
        y="278"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
      >
        Campus
      </text>
      <text
        x="217"
        y="289"
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontSize="8"
      >
        Canteen
      </text>
      {[
        { x: 70, y: 170, id: "1", color: "#7C3AED" },
        { x: 200, y: 20, id: "2", color: "#059669" },
        { x: 326, y: 20, id: "3", color: c.baseRed },
        { x: 217, y: 170, id: "none", color: "#D97706" },
        { x: 326, y: 170, id: "5", color: "#EA4335" },
      ].map((pin) => (
        <g key={pin.id}>
          <ellipse
            cx={pin.x}
            cy={pin.y + 18}
            rx={6}
            ry={3}
            fill="rgba(0,0,0,0.2)"
          />
          <path
            d={`M${pin.x} ${pin.y} C${pin.x - 8} ${pin.y - 8} ${pin.x - 8} ${pin.y - 20} ${pin.x} ${pin.y - 20} C${pin.x + 8} ${pin.y - 20} ${pin.x + 8} ${pin.y - 8} ${pin.x} ${pin.y}`}
            fill={selectedId === pin.id ? pin.color : c.baseRed}
            stroke="white"
            strokeWidth="1.5"
          />
          <circle cx={pin.x} cy={pin.y - 13} r={4} fill="white" />
        </g>
      ))}
      <circle cx="200" cy="145" r="8" fill="#1D4ED8" opacity="0.9" />
      <circle cx="200" cy="145" r="4" fill="white" />
      <circle cx="200" cy="145" r="14" fill="#1D4ED8" opacity="0.2" />
      <text x="215" y="142" fill="#1D4ED8" fontSize="8" fontWeight="700">
        You
      </text>
    </svg>
  );
}

const categories = [
  "All",
  "Classrooms",
  "Labs",
  "Offices",
  "Library",
  "Canteen",
];

/* ── Component ── */
export function MapView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MapTab>("realtime");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  /* Load locations from Supabase */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campus_locations")
        .select(
          "id, name, category, floor, building, icon_key, color, latitude, longitude",
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
            iconKey: (r.icon_key ?? "office") as LocationIconKey,
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

  const getIcon = (
    iconKey: LocationIconKey,
    size = 18,
    color = c.darkBrown,
  ) => {
    if (iconKey === "library") return <BookOpen size={size} color={color} />;
    if (iconKey === "lab") return <Laptop size={size} color={color} />;
    if (iconKey === "office") return <Building2 size={size} color={color} />;
    if (iconKey === "classroom") return <School size={size} color={color} />;
    return <UtensilsCrossed size={size} color={color} />;
  };

  const filtered = locations.filter(
    (l) => activeCategory === "All" || l.category === activeCategory,
  );

  const geoLocations = filtered.filter(
    (l) => l.latitude != null && l.longitude != null,
  );

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
                  eventHandlers={{
                    click: () => setSelectedLocation(loc.id),
                  }}
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

      {/* ═══════════════ BUILDING MAP ═══════════════ */}
      {activeTab === "building" && (
        <>
          <div
            style={{ position: "absolute", inset: 0, background: "#E8F5E9" }}
          >
            <CampusMap selectedId={selectedLocation} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,240,196,0.08)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Search overlay */}
          <div
            style={{ position: "relative", zIndex: 10, padding: "52px 14px 0" }}
          >
            <button
              onClick={() => navigate("/app/map/search")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: c.white,
                border: "none",
                borderRadius: 14,
                padding: "0 14px",
                height: 46,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Search size={18} color={c.warmGray} />
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.warmGray,
                }}
              >
                Search buildings, rooms, offices…
              </span>
            </button>

            {/* Category chips */}
            <div
              style={{
                display: "flex",
                gap: 8,
                paddingTop: 10,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? g.button : c.white,
                    border: "none",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    fontWeight: 600,
                    color: activeCategory === cat ? c.cream : c.darkBrown,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* My Location FAB */}
          <button
            style={{
              position: "absolute",
              right: 14,
              bottom: 300,
              zIndex: 10,
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

          {/* Bottom Sheet */}
          <div
            style={{
              position: "absolute",
              bottom: 70,
              left: 0,
              right: 0,
              zIndex: 20,
              background: c.white,
              borderRadius: "24px 24px 0 0",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
              padding: "12px 16px 16px",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(139,115,85,0.3)",
                margin: "0 auto 14px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  fontWeight: 700,
                  color: c.darkBrown,
                  margin: 0,
                }}
              >
                Nearby Locations
              </p>
              <button
                onClick={() => navigate("/app/map/search")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  color: c.baseRed,
                }}
              >
                <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>
                  See all
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  Loading locations…
                </p>
              ) : filtered.length === 0 ? (
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  No locations found
                </p>
              ) : (
                filtered.slice(0, 3).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc.id);
                      navigate(`/app/map/location/${loc.id}`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background:
                        selectedLocation === loc.id
                          ? `${c.baseRed}08`
                          : c.creamLight,
                      borderRadius: 12,
                      padding: "10px 12px",
                      border: `1px solid ${selectedLocation === loc.id ? c.baseRed + "30" : "transparent"}`,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `${loc.color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(loc.iconKey, 18, loc.color)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 13,
                          fontWeight: 600,
                          color: c.darkBrown,
                          margin: 0,
                        }}
                      >
                        {loc.name}
                      </p>
                      <p
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 11,
                          color: c.warmGray,
                          margin: "2px 0 0",
                        }}
                      >
                        {loc.floor} · {loc.building}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 10,
                          color: loc.color,
                          background: `${loc.color}15`,
                          borderRadius: 20,
                          padding: "1px 7px",
                          display: "inline-block",
                          marginTop: 2,
                        }}
                      >
                        {loc.category}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
