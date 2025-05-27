import { LatLngExpression } from "leaflet";

/**
 * Converts GeoJSON coordinates to Leaflet LatLngExpression format
 * GeoJSON uses [longitude, latitude] while Leaflet uses [latitude, longitude]
 */
export const getPolylinePoints = (
  coordinates: number[][]
): LatLngExpression[] => {
  return coordinates
    .filter(
      (coord) =>
        coord.length === 2 &&
        !isNaN(coord[0]) &&
        !isNaN(coord[1]) &&
        isFinite(coord[0]) &&
        isFinite(coord[1])
    )
    .map((coord) => [coord[1], coord[0]] as LatLngExpression);
};

/**
 * Generates a random color in hex format
 */
export const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
