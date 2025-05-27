import { LatLngExpression } from "leaflet";

// Center of the map (Göteborg, Sweden)
export const MAP_CENTER: LatLngExpression = [57.7089, 11.9746];

// Map configuration
export const MAP_CONFIG = {
  defaultZoom: 12,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};
