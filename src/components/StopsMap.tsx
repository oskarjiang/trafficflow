import React, { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix the default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { SegmentInfo, Stop } from "../types";
import { parseStopData } from "../utils/csvParser";
import { MAP_CENTER, MAP_CONFIG } from "../constants/mapConfig";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";

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
  const [loadedSegments, setLoadedSegments] = useState<number>(0); // Using centralized map configuration

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

        setStops(allStops);
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
  }, []);
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
