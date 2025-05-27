import { ShapePoint, Stop } from "../types";

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
