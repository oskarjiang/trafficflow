import { useState, useEffect } from "react";
import { SegmentInfo } from "../types";

interface DataFetchingResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  loadingProgress: string;
  segmentsInfo: SegmentInfo | null;
  loadedSegments: number;
}

interface UseFetchDataParams<T> {
  /**
   * Path to the segments info JSON file
   */
  segmentsInfoPath: string;

  /**
   * Base path for the segment files
   */
  segmentsBasePath: string;

  /**
   * Parser function that converts raw text data into the desired format
   * @param text The raw text data from the segment file
   * @param isFirstSegment Whether this is the first segment (useful for headers)
   */
  dataParser: (text: string, isFirstSegment: boolean) => any[];

  /**
   * Function to process the loaded data - can be used for filtering, transforming
   * the combined data from all segments before setting the final result
   * @param rawData All data collected from all segments
   */
  dataProcessor?: (rawData: any[]) => T;
}

/**
 * Custom hook to fetch and process segmented data
 * Handles loading states, error handling, and progress reporting
 */
export function useDataFetching<T>({
  segmentsInfoPath,
  segmentsBasePath,
  dataParser,
  dataProcessor = (data) => data as unknown as T,
}: UseFetchDataParams<T>): DataFetchingResult<T> {
  const [data, setData] = useState<T>({} as T);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [segmentsInfo, setSegmentsInfo] = useState<SegmentInfo | null>(null);
  const [loadedSegments, setLoadedSegments] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Load segments info
        setLoadingProgress("Loading segment information...");
        const infoResponse = await fetch(segmentsInfoPath);

        if (!infoResponse.ok) {
          throw new Error("Failed to load segments information");
        }

        const info: SegmentInfo = await infoResponse.json();
        setSegmentsInfo(info);

        // Step 2: Load segments sequentially
        const collectedData: any[] = [];

        for (let i = 0; i < info.segments.length; i++) {
          const segment = info.segments[i];
          setLoadingProgress(
            `Loading segment ${i + 1} of ${info.segments.length}...`
          );

          // Fetch segment data
          const segmentResponse = await fetch(
            `${segmentsBasePath}/${segment.filename}`
          );

          if (!segmentResponse.ok) {
            console.warn(
              `Failed to load segment ${segment.filename}, continuing with next segment`
            );
            continue;
          }

          const segmentText = await segmentResponse.text();
          const isFirstSegment = i === 0;
          const parsedData = dataParser(segmentText, isFirstSegment);

          // Process data
          setLoadingProgress(
            `Processing ${parsedData.length} items from segment ${i + 1}...`
          );

          // Add data to the collection
          collectedData.push(...parsedData);

          // Update loading progress
          setLoadedSegments(i + 1);
          setLoadingProgress(
            `Processed ${i + 1} of ${info.segments.length} segments. Found ${
              collectedData.length
            } items.`
          );
        }

        // Process final data if needed
        setLoadingProgress("Finalizing data processing...");
        const processedData = dataProcessor(collectedData);

        setData(processedData);
        setLoadingProgress("");
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(
          `Failed to load data: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [segmentsInfoPath, segmentsBasePath, dataParser, dataProcessor]);

  return {
    data,
    loading,
    error,
    loadingProgress,
    segmentsInfo,
    loadedSegments,
  };
}
