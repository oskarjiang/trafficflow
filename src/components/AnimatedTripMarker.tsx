import React, { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import {
  currentTimeToMinutes,
  calculateCurrentPosition,
  timeStringToMinutes,
} from "../utils/timeUtils";
import { StopWithTimes } from "../types";

// Create a custom icon for the animated dot
const vehicleIcon = new Icon({
  iconUrl: "/trafficflow_icon.svg", // Using the existing icon from public folder
  iconSize: [20, 20],
  iconAnchor: [10, 10],
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
  }, [stops, latestPassedStopIndex]);

  // Don't render anything until we have a position
  if (!position) return null;

  return (
    <Marker position={position} icon={vehicleIcon}>
      <Popup>
        <div>
          <h3>Trip ID: {tripId}</h3>
          {currentSegmentIndex < stops.length - 1 && (
            <>
              <p>From: {stops[currentSegmentIndex]?.stop.stop_name}</p>
              <p>To: {stops[currentSegmentIndex + 1]?.stop.stop_name}</p>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default AnimatedTripMarker;
