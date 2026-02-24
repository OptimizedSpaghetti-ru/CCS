import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Navigation,
  MapPin,
  Clock,
  ChevronRight,
  BookOpen,
  FlaskConical,
  Briefcase,
  Utensils,
  Library,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";

const categories = [
  "All",
  "Classrooms",
  "Labs",
  "Offices",
  "Library",
  "Canteen",
];

const locations = [
  {
    id: "1",
    name: "Main Library",
    category: "Library",
    floor: "Ground Floor",
    building: "Academic Bldg",
    distance: "120m",
    icon: "📚",
    color: "#7C3AED",
  },
  {
    id: "2",
    name: "Computer Lab 204",
    category: "Labs",
    floor: "2nd Floor",
    building: "ICT Building",
    distance: "85m",
    icon: "💻",
    color: "#059669",
  },
  {
    id: "3",
    name: "CCS Department Office",
    category: "Offices",
    floor: "3rd Floor",
    building: "Tech Building",
    distance: "200m",
    icon: "🏢",
    color: c.baseRed,
  },
  {
    id: "4",
    name: "BSCS 3-A Classroom",
    category: "Classrooms",
    floor: "3rd Floor",
    building: "Tech Building",
    distance: "195m",
    icon: "🏫",
    color: "#D97706",
  },
  {
    id: "5",
    name: "Campus Canteen",
    category: "Canteen",
    floor: "Ground Floor",
    building: "Main Building",
    distance: "60m",
    icon: "🍽️",
    color: "#EA4335",
  },
];

// SVG Campus Map Illustration
function CampusMap({ selectedId }: { selectedId: string | null }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 390 320"
      fill="none"
      style={{ display: "block" }}
    >
      {/* Background */}
      <rect width="390" height="320" fill="#E8F5E9" />
      {/* Pathways */}
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
      {/* Green areas */}
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
      {/* Main Library */}
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
      {/* ICT Building */}
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
      {/* Tech Building */}
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
      {/* Academic Building */}
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
      {/* Main Building */}
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
      {/* Admin Building */}
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
      {/* Canteen */}
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
      {/* Map Pins */}
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
      {/* User location */}
      <circle cx="200" cy="145" r="8" fill="#1D4ED8" opacity="0.9" />
      <circle cx="200" cy="145" r="4" fill="white" />
      <circle cx="200" cy="145" r="14" fill="#1D4ED8" opacity="0.2" />
      <text x="215" y="142" fill="#1D4ED8" fontSize="8" fontWeight="700">
        You
      </text>
    </svg>
  );
}

export function MapView() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const filtered = locations.filter(
    (l) => activeCategory === "All" || l.category === activeCategory,
  );

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
      {/* Full-screen map */}
      <div style={{ position: "absolute", inset: 0, background: "#E8F5E9" }}>
        <CampusMap selectedId={selectedLocation} />
        {/* Warm overlay */}
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
      <div style={{ position: "relative", zIndex: 10, padding: "10px 14px 0" }}>
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
            style={{ fontFamily: fonts.ui, fontSize: 14, color: c.warmGray }}
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
        {/* Handle */}
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
            <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.slice(0, 3).map((loc) => (
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
                  selectedLocation === loc.id ? `${c.baseRed}08` : c.creamLight,
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
                <span style={{ fontSize: 18 }}>{loc.icon}</span>
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
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} color={c.baseRed} />
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      color: c.baseRed,
                      fontWeight: 500,
                    }}
                  >
                    {loc.distance}
                  </span>
                </div>
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
          ))}
        </div>
      </div>
    </div>
  );
}
