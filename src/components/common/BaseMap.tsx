import React, { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { MAP_CENTER, MAP_CONFIG } from "../../constants/mapConfig";

interface BaseMapProps {
  /**
   * The center coordinates for the map
   * @default MAP_CENTER from mapConfig
   */
  center?: LatLngExpression;

  /**
   * Zoom level for the map
   * @default MAP_CONFIG.defaultZoom from mapConfig
   */
  zoom?: number;

  /**
   * Additional className for the map container
   */
  className?: string;

  /**
   * Content to render inside the map (markers, polylines, etc.)
   */
  children: ReactNode;
}

/**
 * Base map component that provides a consistent map container across the application
 */
const BaseMap: React.FC<BaseMapProps> = ({
  center = MAP_CENTER,
  zoom = MAP_CONFIG.defaultZoom,
  className = "",
  children,
}) => {
  return (
    <div className={`map-container ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileUrl}
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default BaseMap;
