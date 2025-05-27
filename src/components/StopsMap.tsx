import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix the default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

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
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [segmentsInfo, setSegmentsInfo] = useState<SegmentInfo | null>(null);
  const [loadedSegments, setLoadedSegments] = useState<number>(0);

  // Get the max number of stops from .env (default to 100 if not specified)
  const MAX_STOPS = process.env.REACT_APP_MAX_STOPS
    ? parseInt(process.env.REACT_APP_MAX_STOPS, 10)
    : 100;

  // Center of the map (Göteborg, Sweden)
  const center: LatLngExpression = [57.7089, 11.9746];

  // Function to parse CSV data into stop objects
  const parseStopData = (text: string, isFirstSegment: boolean): Stop[] => {
    const lines = text.split("\n");
    const result: Stop[] = [];

    // Skip header if this isn't the first segment
    const startIndex = isFirstSegment ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",");
      if (values.length < 4) continue; // Validate coordinates before adding to result
      const lat = parseFloat(values[2]);
      const lon = parseFloat(values[3]);

      if (!isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
        result.push({
          stop_id: values[0],
          stop_name: values[1],
          stop_lat: lat,
          stop_lon: lon,
          location_type: values.length > 4 ? parseInt(values[4], 10) : 0,
          parent_station:
            values.length > 5 && values[5] ? values[5] : undefined,
          platform_code: values.length > 6 && values[6] ? values[6] : undefined,
        });
      }
    }

    return result;
  };

  useEffect(() => {
    const loadStops = async () => {
      try {
        // Step 1: Load segments info
        setLoadingProgress("Loading segment information...");
        const infoResponse = await fetch(
          "/gtfs_vt/stops_segments/segments_info.json"
        );
        if (!infoResponse.ok) {
          throw new Error("Failed to load segments information");
        }

        const info: SegmentInfo = await infoResponse.json();
        setSegmentsInfo(info);

        // Step 2: Load segments sequentially until we reach
        const allStops: Stop[] = [];

        for (let i = 0; i < info.segments.length; i++) {
          const segment = info.segments[i];
          setLoadingProgress(
            `Loading segment ${i + 1} of ${info.segments.length}...`
          );

          // Fetch segment data
          const segmentResponse = await fetch(
            `/gtfs_vt/stops_segments/${segment.filename}`
          );
          if (!segmentResponse.ok) {
            console.warn(
              `Failed to load segment ${segment.filename}, continuing with next segment`
            );
            continue;
          }

          const segmentText = await segmentResponse.text();
          const isFirstSegment = i === 0;
          const stopsFromSegment = parseStopData(segmentText, isFirstSegment);

          // Process stops
          setLoadingProgress(
            `Processing ${stopsFromSegment.length} stops from segment ${
              i + 1
            }...`
          );

          // Add stops to the collection
          allStops.push(...stopsFromSegment);

          // Update loading progress
          setLoadedSegments(i + 1);
          setLoadingProgress(
            `Processed ${i + 1} of ${info.segments.length} segments. Found ${
              allStops.length
            } stops.`
          );
        }

        // Only take up to MAX_STOPS
        setStops(allStops.slice(0, MAX_STOPS));
        setLoading(false);
      } catch (err) {
        console.error("Error loading stops:", err);
        setError(
          `Failed to load stops data: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    };

    loadStops();
  }, [MAX_STOPS]);

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading stops data...</div>
        {loadingProgress && (
          <div className="progress-message">{loadingProgress}</div>
        )}
        {segmentsInfo && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${
                  (loadedSegments / (segmentsInfo?.totalSegments || 1)) * 100
                }%`,
              }}
            ></div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }
  return (
    <div className="map-container">
      <h2>Transit Stops Map</h2>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
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
