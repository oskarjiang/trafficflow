// Common types for the application

// Define interfaces for segment information
export interface SegmentInfo {
  totalSegments: number;
  totalLines: number;
  dataLines: number;
  linesPerSegment: number;
  segments: {
    filename: string;
    index: number;
  }[];
}

// Define the Shape interface
export interface ShapePoint {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled: number;
}

// Define the GeoJSON interface
export interface GeoJsonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    shape_id: string;
  };
}

// Define the Stop interface
export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number;
  parent_station?: string;
  platform_code?: string;
}
