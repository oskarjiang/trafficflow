import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

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

  // Get the max number of shapes from .env (default to 100 if not specified)
  const MAX_SHAPES = process.env.REACT_APP_MAX_SHAPES
    ? parseInt(process.env.REACT_APP_MAX_SHAPES, 10)
    : 100;

  // Center of the map (same as StopsMap)
  const center: LatLngExpression = [57.7089, 11.9746];

  useEffect(() => {
    const loadShapes = async () => {
      try {
        setLoadingProgress("Fetching shapes.txt file...");
        // Fetch the raw shapes.txt file
        const response = await fetch("/gtfs_vt/shapes.txt");
        if (!response.ok) {
          throw new Error(`Failed to fetch shapes.txt: ${response.statusText}`);
        }
        const text = await response.text();
        setLoadingProgress("Parsing shapes data...");

        // Parse CSV text
        const lines = text.split("\n");
        // We know the structure so we don't need to process headers
        lines[0].split(","); // Read but not used

        // Create map to store shape points by shape_id
        const shapePointsMap = new Map<string, ShapePoint[]>();
        let uniqueShapeIds = new Set<string>();

        // Parse each line (skip header)
        setLoadingProgress("Processing shape points...");
        for (
          let i = 1;
          i < lines.length && uniqueShapeIds.size <= MAX_SHAPES;
          i++
        ) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",");
          const shapePoint: ShapePoint = {
            shape_id: values[0],
            shape_pt_lat: parseFloat(values[1]),
            shape_pt_lon: parseFloat(values[2]),
            shape_pt_sequence: parseInt(values[3], 10),
            shape_dist_traveled: values[4] ? parseFloat(values[4]) : 0,
          };

          // Add to map
          if (!shapePointsMap.has(shapePoint.shape_id)) {
            shapePointsMap.set(shapePoint.shape_id, []);
            uniqueShapeIds.add(shapePoint.shape_id);
          }

          if (uniqueShapeIds.size <= MAX_SHAPES) {
            shapePointsMap.get(shapePoint.shape_id)?.push(shapePoint);
          }

          // Progress update every 1000 lines
          if (i % 1000 === 0) {
            setLoadingProgress(
              `Processed ${i} lines, found ${uniqueShapeIds.size} shapes...`
            );
          }
        }

        setLoadingProgress(
          `Converting ${uniqueShapeIds.size} shapes to GeoJSON features...`
        );

        // Convert to GeoJSON features
        const features: GeoJsonFeature[] = [];

        shapePointsMap.forEach((points, shapeId) => {
          // Sort by sequence
          points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

          // Create coordinates array
          const coordinates = points.map((point) => [
            point.shape_pt_lon,
            point.shape_pt_lat,
          ]);

          // Add feature
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
    return coordinates.map((coord) => [coord[1], coord[0]] as LatLngExpression);
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
