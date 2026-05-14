import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useNavigate, useSearchParams } from "react-router";
import L from "leaflet";
import "leaflet-rotate";
import { Map as MapIcon, Navigation, Radio } from "lucide-react";
import { c, fonts, g, shadow } from "../theme";
import { campusLocations } from "../../data/campusLocations";
import { Map } from "./Map";

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

const OLFU_CENTER: [number, number] = [14.679975, 120.981499];
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [14.6784, 120.9799],
  [14.6816, 120.9831],
];
const DEFAULT_ZOOM = 17;
const MIN_ZOOM = DEFAULT_ZOOM;
const CAMPUS_BOUNDS_OBJ = L.latLngBounds(CAMPUS_BOUNDS);

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

const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#1D4ED8;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

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
      aria-label="Recenter to your location"
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

function RightClickRotateControl() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let isRotating = false;
    let lastX = 0;

    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const startRotate = (event: MouseEvent) => {
      if (event.button !== 2) return;
      event.preventDefault();
      isRotating = true;
      lastX = event.clientX;
      container.style.cursor = "ew-resize";
      map.dragging.disable();
    };

    const updateRotate = (event: MouseEvent) => {
      if (!isRotating) return;

      const deltaX = event.clientX - lastX;
      if (deltaX === 0) return;

      lastX = event.clientX;
      const rotateMap = map as any;
      if (
        typeof rotateMap.getBearing === "function" &&
        typeof rotateMap.setBearing === "function"
      ) {
        rotateMap.setBearing(rotateMap.getBearing() + deltaX * 0.35);
      }
    };

    const stopRotate = () => {
      if (!isRotating) return;
      isRotating = false;
      container.style.cursor = "";
      map.dragging.enable();
    };

    container.addEventListener("contextmenu", preventContextMenu);
    container.addEventListener("mousedown", startRotate);
    window.addEventListener("mousemove", updateRotate);
    window.addEventListener("mouseup", stopRotate);
    window.addEventListener("blur", stopRotate);

    return () => {
      stopRotate();
      container.removeEventListener("contextmenu", preventContextMenu);
      container.removeEventListener("mousedown", startRotate);
      window.removeEventListener("mousemove", updateRotate);
      window.removeEventListener("mouseup", stopRotate);
      window.removeEventListener("blur", stopRotate);
    };
  }, [map]);

  return null;
}

export function MapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<MapTab>(() =>
    searchParams.get("view") === "indoor" ? "building" : "realtime",
  );
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hasAutoCenteredToUser = useRef(false);

  const locations = useMemo<MapLocation[]>(
    () =>
      campusLocations.map((location) => ({
        id: location.id,
        name: location.name,
        category: location.category,
        floor: location.floor,
        building: location.building,
        color: location.color,
        latitude: location.latitude,
        longitude: location.longitude,
      })),
    [],
  );

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
    (location) => location.latitude != null && location.longitude != null,
  );

  const rotateOptions = {
    rotate: true,
    touchRotate: true,
    shiftKeyRotate: true,
    rotateControl: { position: "topright" },
  };

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
        height: "calc(100dvh - 74px - env(safe-area-inset-bottom, 0px))",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "min(240px, calc(100vw - 28px))",
          display: "flex",
          background: c.white,
          borderRadius: 12,
          padding: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <button onClick={() => setActiveTab("realtime")} style={tabStyle(activeTab === "realtime")}>
          <Radio size={14} />
          Outdoor Map
        </button>
        <button onClick={() => setActiveTab("building")} style={tabStyle(activeTab === "building")}>
          <MapIcon size={14} />
          Indoor Map
        </button>
      </div>

      {activeTab === "realtime" ? (
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
            <RightClickRotateControl />

            {geoLocations.map((location) => (
              <Marker
                key={location.id}
                position={[location.latitude!, location.longitude!]}
                icon={createMarkerIcon(location.color)}
                eventHandlers={{
                  click: () => navigate(`/app/map/location/${location.id}`),
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
                      {location.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: c.warmGray,
                      }}
                    >
                      {location.floor}
                      {location.floor && location.building ? " - " : ""}
                      {location.building}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        color: location.color,
                        background: `${location.color}15`,
                        borderRadius: 20,
                        padding: "1px 8px",
                      }}
                    >
                      {location.category}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>
                    You are here
                  </span>
                </Popup>
              </Marker>
            )}

            <RecenterButton position={userPos} />
          </MapContainer>
        </div>
      ) : (
        <Map />
      )}
    </div>
  );
}
