import React, { useEffect, useState } from "react";
import { Marker, Popup, Polyline } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix the default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { SegmentInfo, Stop, StopTime } from "../types";
import { parseStopTimeData, parseStopData } from "../utils/csvParser";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface StopWithTimes {
  stop: Stop;
  stopTimes: StopTime[];
}

const StopTimesMap: React.FC = () => {
  const [stopTimes, setStopTimes] = useState<StopTime[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopsMap, setStopsMap] = useState<Map<string, Stop>>(new Map());
  const [stopWithTimesMap, setStopWithTimesMap] = useState<
    Map<string, StopWithTimes>
  >(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [stopTimesSegmentsInfo, setStopTimesSegmentsInfo] =
    useState<SegmentInfo | null>(null);
  const [stopsSegmentsInfo, setStopsSegmentsInfo] =
    useState<SegmentInfo | null>(null);
  const [loadedStopTimesSegments, setLoadedStopTimesSegments] =
    useState<number>(0);
  const [loadedStopsSegments, setLoadedStopsSegments] = useState<number>(0);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [tripStops, setTripStops] = useState<StopWithTimes[]>([]);
  // Sample trip IDs for demo purposes (we'll load the first 20 unique trip IDs)
  const [availableTrips, setAvailableTrips] = useState<string[]>([]);
  // Using centralized map configuration

  useEffect(() => {
    const loadStops = async () => {
      try {
        // Step 1: Load segments info for stops
        setLoadingProgress("Loading stops segment information...");
        const stopsInfoResponse = await fetch(
          "/gtfs_vt/stops_segments/segments_info.json"
        );
        if (!stopsInfoResponse.ok) {
          throw new Error("Failed to load stops segments information");
        }

        const stopsInfo: SegmentInfo = await stopsInfoResponse.json();
        setStopsSegmentsInfo(stopsInfo);

        // Step 2: Load stops segments sequentially
        const allStops: Stop[] = [];
        const stopsMap = new Map<string, Stop>();

        for (let i = 0; i < stopsInfo.segments.length; i++) {
          const segment = stopsInfo.segments[i];
          setLoadingProgress(
            `Loading stops segment ${i + 1} of ${stopsInfo.segments.length}...`
          );

          const segmentResponse = await fetch(
            `/gtfs_vt/stops_segments/${segment.filename}`
          );
          if (!segmentResponse.ok) {
            console.warn(
              `Failed to load stops segment ${segment.filename}, continuing with next segment`
            );
            continue;
          }

          const segmentText = await segmentResponse.text();
          const isFirstSegment = i === 0;
          const stops = parseStopData(segmentText, isFirstSegment);

          // Process stops
          for (const stop of stops) {
            allStops.push(stop);
            stopsMap.set(stop.stop_id, stop);
          }

          setLoadedStopsSegments(i + 1);
          setLoadingProgress(
            `Processed ${i + 1} of ${
              stopsInfo.segments.length
            } stops segments. Found ${allStops.length} stops.`
          );
        }

        setStops(allStops);
        setStopsMap(stopsMap);
        setLoadingProgress("Stops loaded successfully. Loading stop times...");

        // Step 3: Load segments info for stop times
        const stopTimesInfoResponse = await fetch(
          "/gtfs_vt/stop_times_segments/segments_info.json"
        );
        if (!stopTimesInfoResponse.ok) {
          throw new Error("Failed to load stop times segments information");
        }

        const stopTimesInfo: SegmentInfo = await stopTimesInfoResponse.json();
        setStopTimesSegmentsInfo(stopTimesInfo);

        // Step 4: Load stop times segments sequentially (only the first segment for demo)
        const allStopTimes: StopTime[] = [];
        const stopWithTimesMap = new Map<string, StopWithTimes>();
        const uniqueTripIds = new Set<string>();

        // Only load the first segment for demo purposes
        const maxSegmentsToLoad = 1;

        for (
          let i = 0;
          i < Math.min(maxSegmentsToLoad, stopTimesInfo.segments.length);
          i++
        ) {
          const segment = stopTimesInfo.segments[i];
          setLoadingProgress(
            `Loading stop times segment ${i + 1} of ${maxSegmentsToLoad}...`
          );

          const segmentResponse = await fetch(
            `/gtfs_vt/stop_times_segments/${segment.filename}`
          );
          if (!segmentResponse.ok) {
            console.warn(
              `Failed to load stop times segment ${segment.filename}, continuing with next segment`
            );
            continue;
          }

          const segmentText = await segmentResponse.text();
          const isFirstSegment = i === 0;
          const stopTimes = parseStopTimeData(segmentText, isFirstSegment);

          // Process stop times and link to stops
          for (const stopTime of stopTimes) {
            allStopTimes.push(stopTime);
            uniqueTripIds.add(stopTime.trip_id);

            const stop = stopsMap.get(stopTime.stop_id);
            if (stop) {
              if (!stopWithTimesMap.has(stopTime.stop_id)) {
                stopWithTimesMap.set(stopTime.stop_id, {
                  stop,
                  stopTimes: [],
                });
              }
              stopWithTimesMap.get(stopTime.stop_id)?.stopTimes.push(stopTime);
            }
          }

          setLoadedStopTimesSegments(i + 1);
          setLoadingProgress(
            `Processed ${
              i + 1
            } of ${maxSegmentsToLoad} stop times segments. Found ${
              allStopTimes.length
            } stop times.`
          );
        }

        setStopTimes(allStopTimes);
        setStopWithTimesMap(stopWithTimesMap);

        // Get the first 20 unique trip IDs for the demo
        const tripIds = Array.from(uniqueTripIds).slice(0, 20);
        setAvailableTrips(tripIds);

        if (tripIds.length > 0) {
          setSelectedTrip(tripIds[0]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error loading stop times:", err);
        setError(err.message || "Failed to load stop times data");
        setLoading(false);
      }
    };

    loadStops();
  }, []);

  // Update trip stops when selected trip changes
  useEffect(() => {
    if (selectedTrip) {
      const filteredStopTimes = stopTimes
        .filter((st) => st.trip_id === selectedTrip)
        .sort((a, b) => a.stop_sequence - b.stop_sequence);

      const tripStopsList: StopWithTimes[] = [];

      for (const stopTime of filteredStopTimes) {
        const stopWithTime = stopWithTimesMap.get(stopTime.stop_id);
        if (stopWithTime) {
          tripStopsList.push({
            stop: stopWithTime.stop,
            stopTimes: [stopTime], // Only include the current stopTime
          });
        }
      }

      setTripStops(tripStopsList);
    }
  }, [selectedTrip, stopTimes, stopWithTimesMap]);

  if (loading) {
    return (
      <LoadingIndicator
        message={`Loading stop times data... ${loadingProgress}`}
        progress={
          stopTimesSegmentsInfo
            ? (
                (loadedStopTimesSegments /
                  Math.min(1, stopTimesSegmentsInfo.totalSegments)) *
                100
              ).toString()
            : "0"
        }
        segmentsInfo={null}
        loadedSegments={0}
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Create a polyline for the selected trip
  const tripPolyline = tripStops.map(
    (stopWithTime) =>
      [
        stopWithTime.stop.stop_lat,
        stopWithTime.stop.stop_lon,
      ] as LatLngExpression
  );

  return (
    <div className="stop-times-map-container" style={{ height: "100vh" }}>
      <div
        className="trip-selector"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <h3>Select Trip</h3>
        <select
          value={selectedTrip || ""}
          onChange={(e) => setSelectedTrip(e.target.value)}
          style={{ padding: "5px" }}
        >
          {availableTrips.map((tripId) => (
            <option key={tripId} value={tripId}>
              {tripId}
            </option>
          ))}
        </select>
        <div style={{ marginTop: "10px" }}>
          <strong>Trip Stats:</strong>
          <p>Stops: {tripStops.length}</p>
        </div>
      </div>

      <BaseMap className="stop-times-map">
        {/* Display the selected trip route */}
        {tripPolyline.length > 1 && (
          <Polyline positions={tripPolyline} color="blue" weight={3} />
        )}

        {/* Display stops for the selected trip */}
        <MarkerClusterGroup>
          {tripStops.map((stopWithTime, index) => (
            <Marker
              key={`${stopWithTime.stop.stop_id}-${index}`}
              position={[
                stopWithTime.stop.stop_lat,
                stopWithTime.stop.stop_lon,
              ]}
              icon={defaultIcon}
            >
              <Popup>
                <div>
                  <h3>{stopWithTime.stop.stop_name}</h3>
                  <p>Stop ID: {stopWithTime.stop.stop_id}</p>
                  <p>Sequence: {stopWithTime.stopTimes[0].stop_sequence}</p>
                  <p>Arrival: {stopWithTime.stopTimes[0].arrival_time}</p>
                  <p>Departure: {stopWithTime.stopTimes[0].departure_time}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </BaseMap>
    </div>
  );
};

export default StopTimesMap;
