import React from "react";
import { SegmentInfo } from "../../types";
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Stack,
  Paper,
} from "@mui/material";

interface LoadingIndicatorProps {
  message: string;
  progress: string;
  segmentsInfo: SegmentInfo | null;
  loadedSegments: number;
}

/**
 * Reusable loading indicator component with Material UI progress components
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  progress,
  segmentsInfo,
  loadedSegments,
}) => {
  // Calculate progress percentage if segmentsInfo is available
  const progressValue = segmentsInfo
    ? (loadedSegments / segmentsInfo.totalSegments) * 100
    : 0;

  // Convert string progress to number if possible
  const progressNumber = progress ? parseFloat(progress) : 0;
  const hasNumericalProgress = !isNaN(progressNumber);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: "90%",
          borderRadius: 2,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h6" align="center">
            {message}
          </Typography>

          {progress && (
            <Typography variant="body2" color="text.secondary" align="center">
              {progress}
            </Typography>
          )}

          {segmentsInfo ? (
            <Box sx={{ width: "100%" }}>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                align="right"
                sx={{ mt: 1 }}
              >
                {`${Math.round(progressValue)}%`}
              </Typography>
            </Box>
          ) : hasNumericalProgress ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <CircularProgress
                variant="determinate"
                value={progressNumber}
                size={60}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {`${Math.round(progressNumber)}%`}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoadingIndicator;
