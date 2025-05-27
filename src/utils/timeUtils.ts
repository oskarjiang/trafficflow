import { StopTime } from "../types";

/**
 * Converts GTFS time string (which can exceed 24 hours) to minutes since midnight
 * @param timeStr Time string in format "HH:MM:SS" (can exceed 24 hours)
 * @returns Minutes since midnight
 */
export const timeStringToMinutes = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 60 + minutes + seconds / 60;
};

/**
 * Converts current Date object to minutes since midnight
 * @param date Date object (defaults to current time)
 * @returns Minutes since midnight
 */
export const currentTimeToMinutes = (date: Date = new Date()): number => {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
};

/**
 * Determines if a trip is currently active based on its arrival and departure times
 * @param stopTimes Array of StopTime objects for a specific trip
 * @param currentTimeInMinutes Current time in minutes since midnight (optional)
 * @returns Boolean indicating if the trip is currently active
 */
export const isTripActive = (
  stopTimes: StopTime[],
  currentTimeInMinutes?: number
): boolean => {
  if (!stopTimes || stopTimes.length === 0) return false;

  // Sort stops by sequence to ensure first and last stop are correct
  const sortedStops = [...stopTimes].sort(
    (a, b) => a.stop_sequence - b.stop_sequence
  );
  const firstStop = sortedStops[0];
  const lastStop = sortedStops[sortedStops.length - 1];

  if (!firstStop || !lastStop) return false;

  // Get trip start and end times
  const tripStart = timeStringToMinutes(firstStop.departure_time);
  const tripEnd = timeStringToMinutes(lastStop.arrival_time);

  // Use provided time or get current time
  const currentMins = currentTimeInMinutes ?? currentTimeToMinutes();

  // Check if current time is within trip time range
  return currentMins >= tripStart && currentMins <= tripEnd;
};

/**
 * Get all active trips from a list of stop times
 * @param allStopTimes Array of all StopTime objects
 * @returns Map of active trip IDs to their associated StopTimes
 */
export const getActiveTrips = (
  allStopTimes: StopTime[]
): Map<string, StopTime[]> => {
  // Group stop times by trip_id
  const tripStopTimes = new Map<string, StopTime[]>();

  for (const stopTime of allStopTimes) {
    if (!tripStopTimes.has(stopTime.trip_id)) {
      tripStopTimes.set(stopTime.trip_id, []);
    }
    tripStopTimes.get(stopTime.trip_id)?.push(stopTime);
  }

  // Filter for active trips only
  const activeTrips = new Map<string, StopTime[]>();

  // Convert to array before iterating to avoid TypeScript error
  Array.from(tripStopTimes.keys()).forEach((tripId) => {
    const stopTimes = tripStopTimes.get(tripId);
    if (stopTimes && isTripActive(stopTimes)) {
      activeTrips.set(tripId, stopTimes);
    }
  });

  return activeTrips;
};

/**
 * For an active trip, find the latest stop that has been passed
 * @param stopTimes Array of StopTime objects for a specific trip (sorted by stop_sequence)
 * @param currentTimeInMinutes Current time in minutes since midnight (optional)
 * @returns Index of the latest passed stop in the sorted stop times array, or -1 if none have been passed
 */
export const findLatestPassedStopIndex = (
  stopTimes: StopTime[],
  currentTimeInMinutes?: number
): number => {
  if (!stopTimes || stopTimes.length === 0) return -1;

  // Sort stops by sequence
  const sortedStops = [...stopTimes].sort(
    (a, b) => a.stop_sequence - b.stop_sequence
  );

  // Use provided time or get current time
  const currentMins = currentTimeInMinutes ?? currentTimeToMinutes();

  // Find the latest stop that has been passed (arrival time <= current time)
  let latestPassedIndex = -1;

  for (let i = 0; i < sortedStops.length; i++) {
    const stopArrivalTime = timeStringToMinutes(sortedStops[i].arrival_time);
    if (stopArrivalTime <= currentMins) {
      latestPassedIndex = i;
    } else {
      // Stop iterating once we find a stop that hasn't been passed
      break;
    }
  }

  return latestPassedIndex;
};
