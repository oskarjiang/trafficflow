import { useMemo } from "react";
import { GeoJsonFeature, ShapePoint } from "../types";
import { parseShapeData } from "../utils/csvParser";
import { useDataFetching } from "./useDataFetching";

export function useShapesData() {
  // Process shape points into GeoJSON features
  const processShapePointsToGeoJson = (
    shapePoints: ShapePoint[]
  ): GeoJsonFeature[] => {
    const shapePointsMap = new Map<string, ShapePoint[]>();
    const uniqueShapeIds = new Set<string>();

    // Group points by shape_id
    for (const point of shapePoints) {
      // Add new shape to map
      if (!shapePointsMap.has(point.shape_id)) {
        shapePointsMap.set(point.shape_id, []);
        uniqueShapeIds.add(point.shape_id);
      }

      // Add point to existing shape
      shapePointsMap.get(point.shape_id)?.push(point);
    }

    // Convert to GeoJSON features
    const features: GeoJsonFeature[] = [];

    shapePointsMap.forEach((points, shapeId) => {
      // Sort by sequence
      points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);

      // Create coordinates array with validation
      const coordinates = points
        .filter(
          (point) =>
            !isNaN(point.shape_pt_lon) &&
            !isNaN(point.shape_pt_lat) &&
            isFinite(point.shape_pt_lon) &&
            isFinite(point.shape_pt_lat)
        )
        .map((point) => [point.shape_pt_lon, point.shape_pt_lat]);

      // Only add feature if it has valid coordinates
      if (coordinates.length > 0) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
          properties: {
            shape_id: shapeId,
          },
        });
      }
    });

    return features;
  };

  const result = useDataFetching<GeoJsonFeature[]>({
    segmentsInfoPath: "/gtfs_vt/segments/segments_info.json",
    segmentsBasePath: "/gtfs_vt/segments",
    dataParser: parseShapeData,
    dataProcessor: processShapePointsToGeoJson,
  });

  // Generate random color for each shape
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Memoize colors by shape_id to ensure consistency
  const shapeColors = useMemo(() => {
    const colors: Record<string, string> = {};
    result.data.forEach((shape) => {
      if (!colors[shape.properties.shape_id]) {
        colors[shape.properties.shape_id] = getRandomColor();
      }
    });
    return colors;
  }, [result.data]);

  return {
    ...result,
    shapeColors,
  };
}
