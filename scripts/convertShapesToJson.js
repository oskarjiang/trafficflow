const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");

// Path to the shapes.txt file and output JSON file
const shapesFilePath = path.join(__dirname, "..", "gtfs_vt", "shapes.txt");
const outputFilePath = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "shapes.json"
);

// Function to convert shapes.txt to GeoJSON
async function convertShapesToGeoJson() {
  try {
    console.log("Starting shapes conversion...");
    
    // Read the shapes.txt file
    let fileContent = fs.readFileSync(shapesFilePath, "utf8");

    // Remove comment if exists
    if (fileContent.startsWith("//")) {
      const lines = fileContent.split("\n");
      // Remove the first line if it's a comment
      fileContent = lines.slice(1).join("\n");
    }

    // Write the modified content to a temporary file
    const tempFilePath = path.join(__dirname, "temp_shapes.txt");
    fs.writeFileSync(tempFilePath, fileContent);

    // Convert CSV to JSON array
    const jsonArray = await csv().fromFile(tempFilePath);
    
    // Limit to first 100 unique shape_ids
    const uniqueShapeIds = new Set();
    const limitedShapePoints = [];
    
    for (const point of jsonArray) {
      if (uniqueShapeIds.size < 100 || uniqueShapeIds.has(point.shape_id)) {
        limitedShapePoints.push(point);
        uniqueShapeIds.add(point.shape_id);
      }
      
      // Break if we have more than 100 unique shape_ids and this is a new shape
      if (uniqueShapeIds.size >= 100 && 
          limitedShapePoints.length > 0 && 
          limitedShapePoints[limitedShapePoints.length - 1].shape_id !== point.shape_id) {
        break;
      }
    }
    
    console.log(`Processed ${limitedShapePoints.length} points across ${uniqueShapeIds.size} unique shapes`);
    
    // Group shape points by shape_id
    const shapeGroups = {};
    
    limitedShapePoints.forEach(point => {
      if (!shapeGroups[point.shape_id]) {
        shapeGroups[point.shape_id] = [];
      }
      shapeGroups[point.shape_id].push({
        lat: parseFloat(point.shape_pt_lat),
        lng: parseFloat(point.shape_pt_lon),
        sequence: parseInt(point.shape_pt_sequence, 10),
        distance: parseFloat(point.shape_dist_traveled || 0)
      });
    });
    
    // Sort each shape's points by sequence
    Object.keys(shapeGroups).forEach(shapeId => {
      shapeGroups[shapeId].sort((a, b) => a.sequence - b.sequence);
    });
    
    // Create GeoJSON features
    const features = [];
    
    Object.keys(shapeGroups).forEach(shapeId => {
      const points = shapeGroups[shapeId];
      const coordinates = points.map(point => [point.lng, point.lat]);
      
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates
        },
        properties: {
          shape_id: shapeId
        }
      });
    });
    
    // Create the final GeoJSON collection
    const geoJson = {
      type: "FeatureCollection",
      features: features
    };
    
    // Write to output file
    fs.writeFileSync(outputFilePath, JSON.stringify(geoJson, null, 2));
    
    // Remove temporary file
    fs.unlinkSync(tempFilePath);
    
    console.log(`Conversion complete. GeoJSON with ${features.length} shapes saved to ${outputFilePath}`);
  } catch (error) {
    console.error("Error converting shapes to GeoJSON:", error);
  }
}

// Run the conversion
convertShapesToGeoJson();
