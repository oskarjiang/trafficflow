import React from "react";
import { Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CENTER, MAP_CONFIG } from "../constants/mapConfig";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";
import { useShapesData } from "../hooks";
import { getPolylinePoints } from "../utils/mapUtils";

/**
 * Map component that displays transit shapes/routes
 * Uses the BaseMap component for consistent map container
 */
const ShapesMap: React.FC = () => {
  // Use the dedicated hook for shapes data
  const {
    data: shapes,
    loading,
    error,
    loadingProgress,
    segmentsInfo,
    loadedSegments,
    shapeColors,
  } = useShapesData();

  // Show loading state
  if (loading) {
    return (
      <LoadingIndicator
        message="Loading shapes data..."
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

  // Render the map with shapes
  return (
    <BaseMap center={MAP_CENTER} zoom={MAP_CONFIG.defaultZoom}>
      {shapes.map((shape, index) => (
        <Polyline
          key={`${shape.properties.shape_id}-${index}`}
          positions={getPolylinePoints(shape.geometry.coordinates)}
          color={shapeColors[shape.properties.shape_id]}
          weight={3}
          opacity={0.7}
        >
          <Popup>Shape ID: {shape.properties.shape_id}</Popup>
        </Polyline>
      ))}
    </BaseMap>
  );
};

export default ShapesMap;
