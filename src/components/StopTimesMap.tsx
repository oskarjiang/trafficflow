import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix the default marker icon issue in React-Leaflet
import { SegmentInfo, Stop, StopTime } from "../types";
import { parseStopTimeData, parseStopData } from "../utils/csvParser";
import { BaseMap, ErrorMessage, LoadingIndicator } from "./common";
import { getActiveTrips } from "../utils/timeUtils";

interface StopWithTimes {
  stop: Stop;
  stopTimes: StopTime[];
}

interface TripDisplayData {
  tripId: string;
  stops: StopWithTimes[];
  color: string;
}

const StopTimesMap: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [stopTimesSegmentsInfo, setStopTimesSegmentsInfo] =
    useState<SegmentInfo | null>(null);
  const [loadedStopTimesSegments, setLoadedStopTimesSegments] =
    useState<number>(0);
  const [activeTrips, setActiveTrips] = useState<TripDisplayData[]>([]);
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

          setLoadingProgress(
            `Processed ${i + 1} of ${
              stopsInfo.segments.length
            } stops segments. Found ${allStops.length} stops.`
          );
        }

        setLoadingProgress("Stops loaded successfully. Loading stop times...");

        // Step 3: Load segments info for stop times
        const stopTimesInfoResponse = await fetch(
          "/gtfs_vt/stop_times_segments/segments_info.json"
        );
        if (!stopTimesInfoResponse.ok) {
          throw new Error("Failed to load stop times segments information");
        }

        const stopTimesInfo: SegmentInfo = await stopTimesInfoResponse.json();
        setStopTimesSegmentsInfo(stopTimesInfo); // Step 4: Load all stop times segments sequentially
        const allStopTimes: StopTime[] = [];
        const stopWithTimesMap = new Map<string, StopWithTimes>();
        for (let i = 0; i < stopTimesInfo.segments.length; i++) {
          const segment = stopTimesInfo.segments[i];
          setLoadingProgress(
            `Loading stop times segment ${i + 1} of ${
              stopTimesInfo.segments.length
            }...`
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
            `Processed ${i + 1} of ${
              stopTimesInfo.segments.length
            } stop times segments. Found ${allStopTimes.length} stop times.`
          );
        }

        // Get active trips using the timeUtils function
        const activeTripMap = getActiveTrips(allStopTimes);

        // Process active trips into display data with colors
        const tripDisplayData: TripDisplayData[] = [];

        Array.from(activeTripMap.keys()).forEach((tripId) => {
          const tripStopTimes = activeTripMap.get(tripId) || [];
          tripStopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);

          const tripStops: StopWithTimes[] = [];
          for (const stopTime of tripStopTimes) {
            const stopWithTime = stopWithTimesMap.get(stopTime.stop_id);
            if (stopWithTime) {
              tripStops.push({
                stop: stopWithTime.stop,
                stopTimes: [stopTime],
              });
            }
          } // Only add trips with at least 2 stops (to show a line)
          if (tripStops.length >= 2) {
            tripDisplayData.push({
              tripId,
              stops: tripStops,
              color: getRandomColor(),
            });
          }
        });

        setActiveTrips(tripDisplayData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading stop times:", err);
        setError(err.message || "Failed to load stop times data");
        setLoading(false);
      }
    };

    loadStops();
  }, []);

  if (loading) {
    return (
      <LoadingIndicator
        message={`Loading stop times data...`}
        progress={loadingProgress}
        segmentsInfo={stopTimesSegmentsInfo}
        loadedSegments={loadedStopTimesSegments}
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="stop-times-map-container" style={{ height: "100vh" }}>
      <BaseMap className="stop-times-map">
        {/* Display all active trip routes */}
        {activeTrips.map((tripData) => {
          const tripPolyline = tripData.stops.map(
            (stopWithTime) =>
              [
                stopWithTime.stop.stop_lat,
                stopWithTime.stop.stop_lon,
              ] as LatLngExpression
          );

          return (
            <Polyline
              key={tripData.tripId}
              positions={tripPolyline}
              color={tripData.color}
              weight={3}
            />
          );
        })}
      </BaseMap>
    </div>
  );
};

export default StopTimesMap;
function getRandomColor(): string {
  throw new Error("Function not implemented.");
}
