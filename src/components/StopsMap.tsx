import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, LatLngExpression, DivIcon } from "leaflet";
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

// Define the Route interface
export interface Route {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_desc: string;
}

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const StopsMap: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Center of the map (Göteborg, Sweden)
  const center: LatLngExpression = [57.7089, 11.9746];

  // Function to generate a color based on route number
  const getRouteColor = (routeName: string): string => {
    // Simple hash function to generate consistent colors based on route number
    let hash = 0;
    for (let i = 0; i < routeName.length; i++) {
      hash = routeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to a color (ensuring good visibility)
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load stops data
        const stopsResponse = await fetch("/data/stops.json");
        if (!stopsResponse.ok) {
          throw new Error(`Failed to fetch stops: ${stopsResponse.statusText}`);
        }
        const stopsData: Stop[] = await stopsResponse.json();

        // Load routes data
        const routesResponse = await fetch("/data/routes.json");
        if (!routesResponse.ok) {
          throw new Error(
            `Failed to fetch routes: ${routesResponse.statusText}`
          );
        }
        const routesData: Route[] = await routesResponse.json();

        // Take only the first 100 elements for better performance
        setStops(stopsData.slice(0, 100));
        setRoutes(routesData.slice(0, 10)); // Just take 10 routes for simplicity
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Loading stops data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  } // Create a custom icon for each route
  const createRouteIcon = (routeNumber: string, color: string) => {
    return new DivIcon({
      className: "custom-route-icon",
      html: `<div style="
        background-color: ${color}; 
        color: white; 
        border-radius: 50%; 
        width: 24px; 
        height: 24px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);">${routeNumber}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div className="map-container">
      <h2>Transit Stops & Routes Map</h2>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Render stops */}
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

        {/* Render routes as colored circles */}
        {routes.map((route, index) => {
          // Position the route icon at a random stop for visualization
          // In a real application, we would use stop-route relationships
          const randomStop = stops[index % stops.length];
          if (!randomStop) return null;

          const color = getRouteColor(route.route_short_name);
          return (
            <Marker
              key={route.route_id}
              position={[randomStop.stop_lat, randomStop.stop_lon]}
              icon={createRouteIcon(route.route_short_name, color)}
            >
              <Popup>
                <div>
                  <h3>Route {route.route_short_name}</h3>
                  <p>Route ID: {route.route_id}</p>
                  <p>Route Type: {route.route_type}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default StopsMap;
