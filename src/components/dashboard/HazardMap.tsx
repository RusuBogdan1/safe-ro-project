import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Rectangle } from "react-leaflet";
import type { Region, HazardType } from "@/types";
import { cn } from "@/lib/utils";
import { MapPin, Satellite, Waves, Leaf, Layers, Flame, Move } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface HazardMapProps {
  region: Region | null;
  hazardType: HazardType;
  className?: string;
}

const hazardConfig: Record<HazardType, { color: string; icon: typeof Waves; label: string }> = {
  flood: { color: "#0ea5e9", icon: Waves, label: "Flood Risk" },
  vegetation: { color: "#22c55e", icon: Leaf, label: "Vegetation Health" },
  fire: { color: "#ef4444", icon: Flame, label: "Fire Risk" },
  hybrid: { color: "#f97316", icon: Layers, label: "Combined Hazard" },
};

// Component to track map position
function MapTracker({ onPositionChange }: { onPositionChange: (lat: number, lng: number, zoom: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onPositionChange(center.lat, center.lng, zoom);
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onPositionChange(center.lat, center.lng, zoom);
    },
  });
  
  // Initial position
  useEffect(() => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    onPositionChange(center.lat, center.lng, zoom);
  }, []);
  
  return null;
}

// Component to update map view when region changes
function MapController({ region }: { region: Region | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (region) {
      map.flyTo([region.center[0], region.center[1]], region.zoom, { duration: 1 });
    } else {
      map.flyTo([45.9432, 24.9668], 7, { duration: 1 });
    }
  }, [region, map]);
  
  return null;
}

export function HazardMap({ region, hazardType, className }: HazardMapProps) {
  const config = hazardConfig[hazardType];
  const Icon = config.icon;
  
  const [mapPosition, setMapPosition] = useState({
    lat: region?.center[0] || 45.9432,
    lng: region?.center[1] || 24.9668,
    zoom: region?.zoom || 7,
  });

  const handlePositionChange = (lat: number, lng: number, zoom: number) => {
    setMapPosition({ lat, lng, zoom });
  };

  // Default center for Romania
  const defaultCenter: [number, number] = [45.9432, 24.9668];
  const initialCenter: [number, number] = region ? [region.center[0], region.center[1]] : defaultCenter;
  const initialZoom = region?.zoom || 7;

  return (
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden border border-border bg-card", className)}>
      {/* Leaflet Map */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        style={{ background: "#0a0f1a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapTracker onPositionChange={handlePositionChange} />
        <MapController region={region} />
        
        {/* Region bounding box */}
        {region && (
          <Rectangle
            bounds={[
              [region.bbox[1], region.bbox[0]],
              [region.bbox[3], region.bbox[2]],
            ]}
            pathOptions={{
              color: config.color,
              weight: 2,
              fillOpacity: 0.1,
              dashArray: "5, 5",
            }}
          />
        )}
      </MapContainer>

      {/* Hazard Indicator Overlay */}
      {region && (
        <div 
          className="absolute inset-4 border-2 rounded-lg pointer-events-none animate-pulse z-10"
          style={{ 
            borderColor: config.color,
            boxShadow: `0 0 20px ${config.color}40, inset 0 0 20px ${config.color}20`
          }}
        />
      )}

      {/* Info Panel - Now with live coordinates */}
      <div className="absolute top-4 right-4 glass-panel p-3 z-20 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <Satellite className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {region?.displayName || "Romania"}
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Move className="w-3 h-3" />
            <span className="text-primary">Live Position</span>
          </div>
          <div>Lat: {mapPosition.lat.toFixed(4)}°</div>
          <div>Lon: {mapPosition.lng.toFixed(4)}°</div>
          <div>Zoom: {mapPosition.zoom.toFixed(1)}x</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 z-20">
        <h4 className="text-xs font-semibold mb-2 text-foreground">Legend</h4>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: config.color }}>
            <Icon className="w-3 h-3 text-background" />
          </div>
          <span className="text-xs text-muted-foreground">{config.label}</span>
        </div>
        {region && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-4 h-4 rounded border-2 border-dashed border-foreground/50" />
            <span className="text-xs text-muted-foreground">Region Bounds</span>
          </div>
        )}
      </div>

      {/* No region selected overlay */}
      {!region && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-30">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-3 animate-bounce" />
            <p className="text-foreground font-medium">Select a Region</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a region from the control panel to view hazard data</p>
          </div>
        </div>
      )}
    </div>
  );
}
