import React from "react";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix the default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MAP_CENTER, MAP_CONFIG } from "../constants/mapConfig";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";
import { useStopsData } from "../hooks";

// Default marker icon configuration
const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/**
 * Map component that displays transit stops
 * Uses the BaseMap component for consistent map container
 */
const StopsMap: React.FC = () => {
  // Use the dedicated hook for stops data
  const {
    data: stops,
    loading,
    error,
    loadingProgress,
    segmentsInfo,
    loadedSegments,
  } = useStopsData();

  // Show loading state
  if (loading) {
    return (
      <LoadingIndicator
        message="Loading stops data..."
        progress={loadingProgress}
        segmentsInfo={segmentsInfo}
        loadedSegments={loadedSegments}
      />
    );
  }

  // Handle errors
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Render the map with stops markers
  return (
    <BaseMap center={MAP_CENTER} zoom={MAP_CONFIG.defaultZoom}>
      <MarkerClusterGroup
        chunkedLoading={true}
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        disableClusteringAtZoom={16}
      >
        {stops.map((stop) => (
          <Marker
            key={stop.stop_id}
            position={[stop.stop_lat, stop.stop_lon]}
            icon={defaultIcon}
          >
            <Popup>
              <div>
                <h3>{stop.stop_name}</h3>
                <p>ID: {stop.stop_id}</p>
                <p>
                  Coordinates: {stop.stop_lat}, {stop.stop_lon}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </BaseMap>
  );
};

export default StopsMap;
