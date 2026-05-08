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
import { campusLocationById } from "../../data/campusLocations";

interface LocData {
  id: string;
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

export function LocationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loc, setLoc] = useState<LocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageVariantIndex, setImageVariantIndex] = useState(0);

  useEffect(() => {
    const location = id ? campusLocationById.get(id) : undefined;

    if (location) {
      setLoc({
        id: location.id,
        name: location.name,
        category: location.category,
        iconKey: location.icon_key,
        color: location.color,
        floor: location.floor,
        building: location.building,
        description: location.description,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } else {
      setLoc(null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    setImageVariantIndex(0);
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

  const locationImageCandidates = loc
    ? [
        `/location-images/${loc.id}.jpg`,
        `/location-images/${loc.id}.jpeg`,
        `/location-images/${loc.id}.png`,
        `/location-images/${loc.id}.webp`,
      ]
    : [];
  const locationImage = locationImageCandidates[imageVariantIndex] ?? null;

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
      {/* Bottom Sheet Content */}
      <div
        style={{
          flex: 1,
          background: c.white,
          borderRadius: 0,
          overflowY: "auto",
          padding: "12px 20px 20px",
        }}
      >
        <div
          style={{
            position: "relative",
            margin: "0 -20px 18px",
            background: c.creamLight,
          }}
        >
          {locationImage && (
            <img
              src={locationImage}
              alt={`${loc.name} building`}
              onError={() => setImageVariantIndex((index) => index + 1)}
              style={{
                width: "100%",
                height: 280,
                objectFit: "cover",
                display: "block",
                background: c.creamLight,
              }}
            />
          )}
          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "rgba(255, 255, 255, 0.94)",
              border: "none",
              borderRadius: 12,
              width: 40,
              height: 40,
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
