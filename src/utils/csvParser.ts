import { ShapePoint, Stop, StopTime } from "../types";

/**
 * Base function to parse any CSV data with headers in first segment
 * @param text CSV text content
 * @param isFirstSegment Whether this is the first segment (contains headers)
 * @returns Array of string arrays representing parsed CSV rows
 */
const parseCSV = (text: string, isFirstSegment: boolean): string[][] => {
  const lines = text.split("\n");
  const result: string[][] = [];

  // Skip header if this isn't the first segment
  const startIndex = isFirstSegment ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    result.push(values);
  }

  return result;
};

/**
 * Parse CSV data into shape points
 * @param text CSV text content
 * @param isFirstSegment Whether this is the first segment (contains headers)
 * @returns Array of ShapePoint objects
 */
export const parseShapeData = (
  text: string,
  isFirstSegment: boolean
): ShapePoint[] => {
  const parsedRows = parseCSV(text, isFirstSegment);
  const result: ShapePoint[] = [];

  for (const values of parsedRows) {
    if (values.length < 4) continue;

    result.push({
      shape_id: values[0],
      shape_pt_lat: parseFloat(values[1]),
      shape_pt_lon: parseFloat(values[2]),
      shape_pt_sequence: parseInt(values[3], 10),
      shape_dist_traveled: values.length > 4 ? parseFloat(values[4]) : 0,
    });
  }

  return result;
};

/**
 * Parse CSV data into stop objects
 * @param text CSV text content
 * @param isFirstSegment Whether this is the first segment (contains headers)
 * @returns Array of Stop objects
 */
export const parseStopData = (
  text: string,
  isFirstSegment: boolean
): Stop[] => {
  const parsedRows = parseCSV(text, isFirstSegment);
  const result: Stop[] = [];

  for (const values of parsedRows) {
    if (values.length < 4) continue;

    const lat = parseFloat(values[2]);
    const lon = parseFloat(values[3]);

    if (!isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
      result.push({
        stop_id: values[0],
        stop_name: values[1],
        stop_lat: lat,
        stop_lon: lon,
        location_type: values.length > 4 ? parseInt(values[4], 10) : 0,
        parent_station: values.length > 5 && values[5] ? values[5] : undefined,
        platform_code: values.length > 6 && values[6] ? values[6] : undefined,
      });
    }
  }

  return result;
};

/**
 * Parse CSV data into stop time objects
 * @param text CSV text content
 * @param isFirstSegment Whether this is the first segment (contains headers)
 * @returns Array of StopTime objects
 */
export const parseStopTimeData = (
  text: string,
  isFirstSegment: boolean
): StopTime[] => {
  const parsedRows = parseCSV(text, isFirstSegment);
  const result: StopTime[] = [];

  for (const values of parsedRows) {
    if (values.length < 5) continue;

    result.push({
      trip_id: values[0],
      arrival_time: values[1],
      departure_time: values[2],
      stop_id: values[3],
      stop_sequence: parseInt(values[4], 10),
      stop_headsign: values.length > 5 ? values[5] : undefined,
      pickup_type: values.length > 6 ? parseInt(values[6], 10) : undefined,
      drop_off_type: values.length > 7 ? parseInt(values[7], 10) : undefined,
      shape_dist_traveled:
        values.length > 8 ? parseFloat(values[8]) : undefined,
      timepoint: values.length > 9 ? parseInt(values[9], 10) : undefined,
      pickup_booking_rule_id: values.length > 10 ? values[10] : undefined,
      drop_off_booking_rule_id: values.length > 11 ? values[11] : undefined,
    });
  }

  return result;
};
