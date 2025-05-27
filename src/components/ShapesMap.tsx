import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Define interfaces for segment information
interface SegmentInfo {
  totalSegments: number;
  totalLines: number;
  dataLines: number;
  linesPerSegment: number;
  segments: {
    filename: string;
    index: number;
  }[];
}

// Define the Shape interface
interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled: number;
}

// Define the GeoJSON interface
interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    shape_id: string;
  };
}

const ShapesMap: React.FC = () => {
  const [shapes, setShapes] = useState<GeoJsonFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [segmentsInfo, setSegmentsInfo] = useState<SegmentInfo | null>(null);
  const [loadedSegments, setLoadedSegments] = useState<number>(0);

  // Get the max number of shapes from .env (default to 100 if not specified)
  const MAX_SHAPES = process.env.REACT_APP_MAX_SHAPES
    ? parseInt(process.env.REACT_APP_MAX_SHAPES, 10)
    : 100;

  // Center of the map (same as StopsMap)
  const center: LatLngExpression = [57.7089, 11.9746];

  // Function to parse CSV data into shape points
  const parseShapeData = (
    text: string,
    isFirstSegment: boolean
  ): ShapePoint[] => {
    const lines = text.split("\n");
    const result: ShapePoint[] = [];

    // Skip header if this isn't the first segment
    const startIndex = isFirstSegment ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",");
      if (values.length < 4) continue;

      result.push({
        shape_id: values[0],
        shape_pt_lat: parseFloat(values[1]),
        shape_pt_lon: parseFloat(values[2]),
        shape_pt_sequence: parseInt(values[3], 10),
        shape_dist_traveled: values.length > 4 ? parseFloat(values[4]) : 0,
      });
    }

    return result;
  };

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
        // Step 2: Load segments sequentially until we reach MAX_SHAPES
        const shapePointsMap = new Map<string, ShapePoint[]>();
        let uniqueShapeIds = new Set<string>();

        for (let i = 0; i < info.segments.length; i++) {
          if (uniqueShapeIds.size >= MAX_SHAPES) {
            break; // Stop if we've already gathered enough shapes
          }

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
            // If we have enough shapes and this is a new shape, skip it
            if (
              uniqueShapeIds.size >= MAX_SHAPES &&
              !shapePointsMap.has(point.shape_id)
            ) {
              continue;
            }

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

          // If we have enough shapes, stop loading more segments
          if (uniqueShapeIds.size >= MAX_SHAPES) {
            break;
          }
        }

        setLoadingProgress(
          `Converting ${uniqueShapeIds.size} shapes to GeoJSON...`
        );

        // Convert to GeoJSON features
        const features: GeoJsonFeature[] = [];

        shapePointsMap.forEach((points, shapeId) => {
          // Sort by sequence
          points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);          // Create coordinates array with validation
          const coordinates = points
            .filter(point => 
              !isNaN(point.shape_pt_lon) && 
              !isNaN(point.shape_pt_lat) &&
              isFinite(point.shape_pt_lon) && 
              isFinite(point.shape_pt_lat)
            )
            .map((point) => [
              point.shape_pt_lon,
              point.shape_pt_lat,
            ]);

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
  }, [MAX_SHAPES]);
  // Function to convert GeoJSON coordinates to LatLngExpression[]
  const getPolylinePoints = (coordinates: number[][]): LatLngExpression[] => {
    return coordinates
      .filter(coord => 
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
  return (
    <div style={{ height: "80vh", width: "100%" }}>
      {loading && (
        <div className="loading-container">
          <div>Loading shapes data...</div>
          {loadingProgress && (
            <div className="progress-message">{loadingProgress}</div>
          )}
          {segmentsInfo && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${
                    (loadedSegments / segmentsInfo.totalSegments) * 100
                  }%`,
                }}
              ></div>
            </div>
          )}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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
        </MapContainer>
      )}
    </div>
  );
};

export default ShapesMap;
