import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  Clock,
  X,
  BookOpen,
  Laptop,
  Building2,
  School,
  UtensilsCrossed,
  Monitor,
  Landmark,
  Handshake,
  Clapperboard,
  GraduationCap,
  Map,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";

type LocationIconKey =
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

interface MapLoc {
  id: string;
  name: string;
  category: string;
  floor: string;
  building: string;
  iconKey: LocationIconKey;
  color: string;
}

export function MapSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [allLocations, setAllLocations] = useState<MapLoc[]>([]);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campus_locations")
        .select("id, name, category, floor, building, icon_key, color")
        .order("name");
      if (data) {
        const mapped = data.map((r: any) => ({
          id: String(r.id),
          name: r.name ?? "",
          category: r.category ?? "",
          floor: r.floor ?? "",
          building: r.building ?? "",
          iconKey: (r.icon_key ?? "office") as LocationIconKey,
          color: r.color ?? c.baseRed,
        }));
        setAllLocations(mapped);
        const counts: Record<string, number> = {};
        mapped.forEach((l) => {
          counts[l.category] = (counts[l.category] || 0) + 1;
        });
        setCatCounts(counts);
      }
    })();
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
    if (iconKey === "canteen")
      return <UtensilsCrossed size={size} color={color} />;
    if (iconKey === "computer") return <Monitor size={size} color={color} />;
    if (iconKey === "facility") return <Landmark size={size} color={color} />;
    if (iconKey === "guidance") return <Handshake size={size} color={color} />;
    if (iconKey === "media") return <Clapperboard size={size} color={color} />;
    return <GraduationCap size={size} color={color} />;
  };

  const results =
    query.length > 0
      ? allLocations.filter(
          (l) =>
            l.name.toLowerCase().includes(query.toLowerCase()) ||
            l.category.toLowerCase().includes(query.toLowerCase()) ||
            l.building.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: c.creamLight,
      }}
    >
      {/* Search Header */}
      <div
        style={{
          background: g.header,
          padding: "12px 14px 14px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate("/app/map")}
            style={{
              background: "rgba(255,240,196,0.15)",
              border: "none",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} color={c.cream} />
          </button>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: c.white,
              borderRadius: 12,
              padding: "0 12px",
              height: 42,
            }}
          >
            <Search size={16} color={c.warmGray} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings, rooms, offices…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: fonts.ui,
                fontSize: 13,
                color: c.darkBrown,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.warmGray,
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {query === "" ? (
          /* Recent Searches */
          <div style={{ padding: "16px" }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 11,
                fontWeight: 600,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "0 0 10px",
              }}
            >
              Recently Added
            </p>
            {allLocations.slice(0, 3).map((r) => (
              <button
                key={r.id}
                onClick={() => setQuery(r.name)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: c.white,
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: shadow.card,
                }}
              >
                <Clock size={16} color={c.warmGray} />
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 13,
                    color: c.darkBrown,
                  }}
                >
                  {r.name}
                </span>
              </button>
            ))}

            {/* Category Quick Access */}
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 11,
                fontWeight: 600,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "16px 0 10px",
              }}
            >
              Browse by Category
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Classrooms",
                  iconKey: "classroom" as LocationIconKey,
                  color: "#D97706",
                },
                {
                  label: "Labs",
                  iconKey: "lab" as LocationIconKey,
                  color: "#059669",
                },
                {
                  label: "Offices",
                  iconKey: "office" as LocationIconKey,
                  color: c.baseRed,
                },
                {
                  label: "Canteen",
                  iconKey: "canteen" as LocationIconKey,
                  color: "#EA4335",
                },
                {
                  label: "Library",
                  iconKey: "library" as LocationIconKey,
                  color: "#7C3AED",
                },
                {
                  label: "Facilities",
                  iconKey: "facility" as LocationIconKey,
                  color: "#374151",
                },
              ].map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setQuery(cat.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: c.white,
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: shadow.card,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${cat.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getIcon(cat.iconKey, 18, cat.color)}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        fontWeight: 600,
                        color: c.darkBrown,
                        margin: 0,
                      }}
                    >
                      {cat.label}
                    </p>
                    <p
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        color: c.warmGray,
                        margin: 0,
                      }}
                    >
                      {catCounts[cat.label] ?? 0} locations
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          /* Search Results */
          <div style={{ padding: "12px 16px" }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: c.warmGray,
                margin: "0 0 10px",
              }}
            >
              {results.length} result{results.length !== 1 ? "s" : ""} for "
              <strong style={{ color: c.darkBrown }}>{query}</strong>"
            </p>
            {results.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/app/map/location/${loc.id}`)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: c.white,
                  border: "none",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: shadow.card,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${loc.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {getIcon(loc.iconKey, 20, loc.color)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 14,
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
                      fontSize: 12,
                      color: c.warmGray,
                      margin: "2px 0 0",
                    }}
                  >
                    {loc.floor} · {loc.building}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/map/location/${loc.id}`);
                    }}
                    style={{
                      marginTop: 4,
                      background: "none",
                      border: `1.5px solid ${c.baseRed}`,
                      borderRadius: 20,
                      padding: "2px 8px",
                      fontFamily: fonts.ui,
                      fontSize: 10,
                      color: c.baseRed,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Details
                  </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* No Results */
          <div style={{ padding: "60px 32px", textAlign: "center" }}>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Map size={48} color={c.warmGray} />
            </div>
            <h3
              style={{
                fontFamily: fonts.display,
                fontSize: 18,
                color: c.darkBrown,
                margin: "0 0 8px",
              }}
            >
              Location not found
            </h3>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
                margin: 0,
              }}
            >
              Try a different search term or browse by category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
