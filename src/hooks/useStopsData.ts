import { Stop } from "../types";
import { parseStopData } from "../utils/csvParser";
import { useDataFetching } from "./useDataFetching";

export function useStopsData() {
  return useDataFetching<Stop[]>({
    segmentsInfoPath: "/gtfs_vt/stops_segments/segments_info.json",
    segmentsBasePath: "/gtfs_vt/stops_segments",
    dataParser: parseStopData,
    // No additional processing needed for stops data, we can use it as-is
  });
}
