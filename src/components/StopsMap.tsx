import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix the default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Define the Stop interface
export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number;
  parent_station?: string;
  platform_code?: string;
}

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const StopsMap: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Center of the map (Göteborg, Sweden)
  const center: LatLngExpression = [57.7089, 11.9746];

  useEffect(() => {
    const loadStops = async () => {
      try {
        const response = await fetch("/data/stops.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch stops: ${response.statusText}`);
        }
        const stopsData: Stop[] = await response.json();
        // Take only the first 100 elements for better performance
        setStops(stopsData.slice(0, 100));
        setLoading(false);
      } catch (err) {
        console.error("Error loading stops:", err);
        setError("Failed to load stops data");
        setLoading(false);
      }
    };

    loadStops();
  }, []);

  if (loading) {
    return <div className="loading">Loading stops data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="map-container">
      <h2>Transit Stops Map</h2>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
      </MapContainer>
    </div>
  );
};

export default StopsMap;
