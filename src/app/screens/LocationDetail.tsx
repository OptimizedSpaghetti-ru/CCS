import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Share2,
  BookOpen,
  Laptop,
  Building2,
  Loader,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";

interface LocData {
  name: string;
  category: string;
  iconKey: string;
  color: string;
  floor: string;
  building: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

function RouteMap({ color }: { color: string }) {
  return (
    <svg width="100%" height="180" viewBox="0 0 390 180" fill="none">
      <rect width="390" height="180" fill="#E8F5E9" />
      {/* Streets */}
      <rect x="0" y="75" width="390" height="20" fill="#F5F5F5" opacity="0.9" />
      <rect
        x="160"
        y="0"
        width="20"
        height="180"
        fill="#F5F5F5"
        opacity="0.9"
      />
      <rect
        x="270"
        y="0"
        width="16"
        height="180"
        fill="#F5F5F5"
        opacity="0.7"
      />
      {/* Buildings */}
      <rect
        x="10"
        y="10"
        width="140"
        height="60"
        rx="5"
        fill="#D1D5DB"
        opacity="0.7"
      />
      <rect
        x="190"
        y="10"
        width="70"
        height="60"
        rx="5"
        fill="#D1D5DB"
        opacity="0.7"
      />
      <rect
        x="10"
        y="100"
        width="140"
        height="70"
        rx="5"
        fill="#D1D5DB"
        opacity="0.7"
      />
      <rect
        x="190"
        y="100"
        width="70"
        height="70"
        rx="5"
        fill={color}
        opacity="0.7"
      />
      <rect
        x="295"
        y="10"
        width="85"
        height="60"
        rx="5"
        fill="#D1D5DB"
        opacity="0.7"
      />
      <rect
        x="295"
        y="100"
        width="85"
        height="70"
        rx="5"
        fill="#D1D5DB"
        opacity="0.7"
      />
      {/* Route */}
      <path
        d="M200 95 L200 75 L200 75 L190 75 L160 75 L160 140 L195 140"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 4"
      />
      {/* Start (user) */}
      <circle cx="200" cy="95" r="8" fill="#1D4ED8" />
      <circle cx="200" cy="95" r="4" fill="white" />
      <circle cx="200" cy="95" r="14" fill="#1D4ED8" opacity="0.2" />
      {/* Destination pin */}
      <path
        d="M195 155 C195 148 188 143 188 135 C188 128 191 122 195 120 C199 122 202 128 202 135 C202 143 195 148 195 155"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="195" cy="133" r="4" fill="white" />
    </svg>
  );
}

export function LocationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loc, setLoc] = useState<LocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campus_locations")
        .select(
          "name, category, description, floor, building, icon_key, color, latitude, longitude",
        )
        .eq("id", Number(id) || 0)
        .single();
      if (data) {
        setLoc({
          name: data.name ?? "",
          category: data.category ?? "",
          iconKey: data.icon_key ?? "office",
          color: data.color ?? c.baseRed,
          floor: data.floor ?? "",
          building: data.building ?? "",
          description: data.description ?? "",
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const locationIcon = (size: number) => {
    if (!loc) return null;
    if (loc.iconKey === "library")
      return <BookOpen size={size} color={loc.color} />;
    if (loc.iconKey === "lab") return <Laptop size={size} color={loc.color} />;
    return <Building2 size={size} color={loc.color} />;
  };

  const handleGetDirections = () => {
    if (loc?.latitude && loc?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`,
        "_blank",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader
          size={24}
          color={c.baseRed}
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!loc) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <p style={{ fontFamily: fonts.ui, fontSize: 16, color: c.darkBrown }}>
          Location not found
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            fontFamily: fonts.ui,
            fontSize: 13,
            color: c.baseRed,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Mini Map */}
      <div style={{ flexShrink: 0, position: "relative" }}>
        <RouteMap color={loc.color} />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            background: c.white,
            border: "none",
            borderRadius: 10,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: shadow.card,
          }}
        >
          <ArrowLeft size={18} color={c.darkBrown} />
        </button>
      </div>

      {/* Bottom Sheet Content */}
      <div
        style={{
          flex: 1,
          background: c.white,
          borderRadius: "24px 24px 0 0",
          overflowY: "auto",
          marginTop: -20,
          padding: "16px 20px 20px",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(139,115,85,0.25)",
            margin: "0 auto 16px",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${loc.color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {locationIcon(22)}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                fontWeight: 700,
                color: c.darkBrown,
                margin: "0 0 4px",
                lineHeight: 1.2,
              }}
            >
              {loc.name}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: `${loc.color}15`,
                  color: loc.color,
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {locationIcon(12)} {loc.category}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={12} color={c.warmGray} />
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                  }}
                >
                  {loc.floor} · {loc.building}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {loc.description && (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.darkBrown,
              lineHeight: 1.6,
              margin: "0 0 16px",
            }}
          >
            {loc.description}
          </p>
        )}

        {/* Action buttons */}
        <button
          onClick={handleGetDirections}
          disabled={!loc.latitude || !loc.longitude}
          style={{
            width: "100%",
            height: 50,
            background:
              loc.latitude && loc.longitude ? g.button : "rgba(139,115,85,0.2)",
            border: "none",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: fonts.ui,
            fontSize: 15,
            fontWeight: 600,
            color: loc.latitude && loc.longitude ? c.cream : c.warmGray,
            cursor: loc.latitude && loc.longitude ? "pointer" : "default",
            marginBottom: 10,
            boxShadow: loc.latitude && loc.longitude ? shadow.button : "none",
          }}
        >
          <Navigation size={18} />
          {loc.latitude && loc.longitude
            ? "Get Directions"
            : "No coordinates available"}
        </button>
        <button
          style={{
            width: "100%",
            height: 46,
            background: "transparent",
            border: `2px solid ${c.baseRed}`,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: fonts.ui,
            fontSize: 15,
            fontWeight: 600,
            color: c.baseRed,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          <Share2 size={18} />
          Share Location
        </button>
      </div>
    </div>
  );
}
