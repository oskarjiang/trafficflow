import React, { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import {
  currentTimeToMinutes,
  calculateCurrentPosition,
  timeStringToMinutes,
} from "../utils/timeUtils";
import { StopWithTimes } from "../types";

// Create a custom icon for the animated transit vehicle
const vehicleIcon = new Icon({
  iconUrl: "/trafficflow_app_icon.svg", // Custom designed icon that fits the app's purpose
  iconSize: [32, 32],
  iconAnchor: [16, 16], // Centered anchor point
  className: "vehicle-marker", // Add a class for potential CSS animations
});

interface AnimatedTripMarkerProps {
  tripId: string;
  stops: StopWithTimes[];
  color: string;
  latestPassedStopIndex: number;
}

const AnimatedTripMarker: React.FC<AnimatedTripMarkerProps> = ({
  tripId,
  stops,
  color,
  latestPassedStopIndex,
}) => {
  // State for the current position
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Store the animation frame reference to clean up
  const animationFrameRef = useRef<number | null>(null);

  // Stop index state to track which segment we're on
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(
    latestPassedStopIndex
  );

  useEffect(() => {
    // The animation function that gets called on each frame
    const animate = () => {
      const currentTime = currentTimeToMinutes();

      // Find the current segment (between which stops we are)
      let newSegmentIndex = latestPassedStopIndex;

      // Look ahead to find the next stop we're heading towards
      for (let i = latestPassedStopIndex; i < stops.length - 1; i++) {
        const currentStop = stops[i];
        const nextStop = stops[i + 1];

        if (!currentStop?.stopTimes[0] || !nextStop?.stopTimes[0]) continue;

        const departureTime = timeStringToMinutes(
          currentStop.stopTimes[0].departure_time
        );
        const arrivalTime = timeStringToMinutes(
          nextStop.stopTimes[0].arrival_time
        );

        // If we're between these stops
        if (currentTime >= departureTime && currentTime <= arrivalTime) {
          newSegmentIndex = i;
          break;
        }
      }

      // Update the segment index if it changed
      if (newSegmentIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(newSegmentIndex);
      }

      // If we have a valid segment, calculate the position
      if (newSegmentIndex < stops.length - 1) {
        const fromStop = stops[newSegmentIndex];
        const toStop = stops[newSegmentIndex + 1];

        // Make sure both stops have valid data
        if (
          fromStop?.stop &&
          toStop?.stop &&
          fromStop?.stopTimes[0] &&
          toStop?.stopTimes[0]
        ) {
          const fromCoords: [number, number] = [
            fromStop.stop.stop_lat,
            fromStop.stop.stop_lon,
          ];
          const toCoords: [number, number] = [
            toStop.stop.stop_lat,
            toStop.stop.stop_lon,
          ];
          const departureTime = timeStringToMinutes(
            fromStop.stopTimes[0].departure_time
          );
          const arrivalTime = timeStringToMinutes(
            toStop.stopTimes[0].arrival_time
          );

          // Calculate the interpolated position
          const newPosition = calculateCurrentPosition(
            fromCoords,
            toCoords,
            departureTime,
            arrivalTime,
            currentTime
          );

          setPosition(newPosition);
        }
      }

      // Schedule the next animation frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stops, latestPassedStopIndex, currentSegmentIndex]);

  // Don't render anything until we have a position
  if (!position) return null;
  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div
          style={{
            padding: "5px",
            borderLeft: `4px solid ${color}`,
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3 style={{ margin: "2px 0", color: "#1565C0" }}>Transit Vehicle</h3>
          <p style={{ fontSize: "0.8em", color: "#757575", margin: "2px 0" }}>
            ID: {tripId}
          </p>
          {currentSegmentIndex < stops.length - 1 && (
            <>
              <div style={{ margin: "8px 0" }}>
                <div style={{ fontWeight: "bold", color: "#424242" }}>
                  Current Route:
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "5px" }}>📍</span>
                  <p style={{ margin: "2px 0" }}>
                    {stops[currentSegmentIndex]?.stop.stop_name}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "5px" }}>🔜</span>
                  <p style={{ margin: "2px 0" }}>
                    {stops[currentSegmentIndex + 1]?.stop.stop_name}
                  </p>
                </div>
              </div>
              {stops[currentSegmentIndex + 1]?.stopTimes[0]?.arrival_time && (
                <p style={{ fontSize: "0.9em", margin: "5px 0" }}>
                  <span style={{ fontWeight: "bold" }}>ETA: </span>
                  {stops[currentSegmentIndex + 1].stopTimes[0].arrival_time}
                </p>
              )}
            </>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default AnimatedTripMarker;
