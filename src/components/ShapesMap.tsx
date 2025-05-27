import React, { useEffect, useState } from "react";
import { Polyline, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { SegmentInfo, ShapePoint, GeoJsonFeature } from "../types";
import { parseShapeData } from "../utils/csvParser";
import { MAP_CENTER, MAP_CONFIG } from "../constants/mapConfig";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";

const ShapesMap: React.FC = () => {
  const [shapes, setShapes] = useState<GeoJsonFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [segmentsInfo, setSegmentsInfo] = useState<SegmentInfo | null>(null);
  const [loadedSegments, setLoadedSegments] = useState<number>(0); // Using centralized map configuration

  useEffect(() => {
    const loadShapes = async () => {
      try {
        // Step 1: Load segments info
        setLoadingProgress("Loading segment information...");
        const infoResponse = await fetch(
          "/gtfs_vt/segments/segments_info.json"
        );
        if (!infoResponse.ok) {
          throw new Error("Failed to load segments information");
        }

        const info: SegmentInfo = await infoResponse.json();
        setSegmentsInfo(info);
        // Step 2: Load segments sequentially
        const shapePointsMap = new Map<string, ShapePoint[]>();
        let uniqueShapeIds = new Set<string>();

        for (let i = 0; i < info.segments.length; i++) {
          const segment = info.segments[i];
          setLoadingProgress(
            `Loading segment ${i + 1} of ${info.segments.length}...`
          );

          // Fetch segment data
          const segmentResponse = await fetch(
            `/gtfs_vt/segments/${segment.filename}`
          );
          if (!segmentResponse.ok) {
            console.warn(
              `Failed to load segment ${segment.filename}, continuing with next segment`
            );
            continue;
          }

          const segmentText = await segmentResponse.text();
          const isFirstSegment = i === 0;
          const shapePoints = parseShapeData(segmentText, isFirstSegment);

          // Process shape points
          setLoadingProgress(
            `Processing ${shapePoints.length} points from segment ${i + 1}...`
          );

          for (const point of shapePoints) {
            // Add new shape to map
            if (!shapePointsMap.has(point.shape_id)) {
              shapePointsMap.set(point.shape_id, []);
              uniqueShapeIds.add(point.shape_id);
            }

            // Add point to existing shape
            shapePointsMap.get(point.shape_id)?.push(point);
          }

          // Update loading progress
          setLoadedSegments(i + 1);
          setLoadingProgress(
            `Processed ${i + 1} of ${info.segments.length} segments. Found ${
              uniqueShapeIds.size
            } shapes.`
          );
        }

        setLoadingProgress(
          `Converting ${uniqueShapeIds.size} shapes to GeoJSON...`
        );

        // Convert to GeoJSON features
        const features: GeoJsonFeature[] = [];

        shapePointsMap.forEach((points, shapeId) => {
          // Sort by sequence
          points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence); // Create coordinates array with validation
          const coordinates = points
            .filter(
              (point) =>
                !isNaN(point.shape_pt_lon) &&
                !isNaN(point.shape_pt_lat) &&
                isFinite(point.shape_pt_lon) &&
                isFinite(point.shape_pt_lat)
            )
            .map((point) => [point.shape_pt_lon, point.shape_pt_lat]);

          // Only add feature if it has valid coordinates
          if (coordinates.length > 0) {
            features.push({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
              properties: {
                shape_id: shapeId,
              },
            });
          }
        });

        setLoadingProgress("");
        setShapes(features);
        setLoading(false);
      } catch (err) {
        console.error("Error loading shapes:", err);
        setError(
          `Failed to load shapes data: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    };

    loadShapes();
  }, []);
  // Function to convert GeoJSON coordinates to LatLngExpression[]
  const getPolylinePoints = (coordinates: number[][]): LatLngExpression[] => {
    return coordinates
      .filter(
        (coord) =>
          coord.length === 2 &&
          !isNaN(coord[0]) &&
          !isNaN(coord[1]) &&
          isFinite(coord[0]) &&
          isFinite(coord[1])
      )
      .map((coord) => [coord[1], coord[0]] as LatLngExpression);
  };

  // Generate random color for each shape
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Memoize colors by shape_id to ensure consistency
  const shapeColors = React.useMemo(() => {
    const colors: Record<string, string> = {};
    shapes.forEach((shape) => {
      if (!colors[shape.properties.shape_id]) {
        colors[shape.properties.shape_id] = getRandomColor();
      }
    });
    return colors;
  }, [shapes]);
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
  if (error) {
    return <ErrorMessage message={error} />;
  }
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
