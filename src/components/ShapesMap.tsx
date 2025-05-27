import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface GeoJsonCollection {
  type: string;
  features: GeoJsonFeature[];
}

const ShapesMap: React.FC = () => {
  const [shapes, setShapes] = useState<GeoJsonFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Center of the map (same as StopsMap)
  const center: LatLngExpression = [57.7089, 11.9746];

  useEffect(() => {
    const loadShapes = async () => {
      try {
        const response = await fetch("/data/shapes.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch shapes: ${response.statusText}`);
        }

        const shapesData: GeoJsonCollection = await response.json();
        setShapes(shapesData.features);
        setLoading(false);
      } catch (err) {
        console.error("Error loading shapes:", err);
        setError("Failed to load shapes data");
        setLoading(false);
      }
    };

    loadShapes();
  }, []);

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
      {loading && <div>Loading shapes data...</div>}
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
