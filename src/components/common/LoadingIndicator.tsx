import React from "react";
import { SegmentInfo } from "../../types";

interface LoadingIndicatorProps {
  message: string;
  progress: string;
  segmentsInfo: SegmentInfo | null;
  loadedSegments: number;
}

/**
 * Reusable loading indicator component with progress bar
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  progress,
  segmentsInfo,
  loadedSegments,
}) => {
  return (
    <div className="loading-container">
      <div>{message}</div>
      {progress && <div className="progress-message">{progress}</div>}
      {segmentsInfo && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{
              width: `${(loadedSegments / segmentsInfo.totalSegments) * 100}%`,
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
