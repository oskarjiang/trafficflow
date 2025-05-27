import stopsData from "../../gtfs_vt/stops.txt";

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: string;
  parent_station?: string;
  platform_code?: string;
}

export const parseStops = async (): Promise<Stop[]> => {
  try {
    // Fetch the stops.txt content
    const response = await fetch(stopsData);
    const text = await response.text();

    // Parse CSV content
    const lines = text.split("\n");
    const headers = lines[0].split(",");

    const stops: Stop[] = [];

    // Parse each line, starting from line 1 (skipping header)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",");
      const stop: any = {};

      // Map each value to its corresponding header
      headers.forEach((header, index) => {
        if (header === "stop_lat" || header === "stop_lon") {
          stop[header] = parseFloat(values[index]);
        } else {
          stop[header] = values[index];
        }
      });

      stops.push(stop as Stop);
    }

    return stops;
  } catch (error) {
    console.error("Error parsing stops data:", error);
    return [];
  }
};
