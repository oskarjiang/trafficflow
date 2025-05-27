const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");

// Path to the stops.txt file and output JSON file
const stopsFilePath = path.join(__dirname, "..", "gtfs_vt", "stops.txt");
const outputFilePath = path.join(__dirname, "public", "data", "stops.json");

// Convert CSV to JSON
(async () => {
  try {
    // Remove the first line if it contains comments
    let fileContent = fs.readFileSync(stopsFilePath, "utf8");

    // Remove comment if exists
    if (fileContent.startsWith("//")) {
      const lines = fileContent.split("\n");
      // Remove the first line if it's a comment
      fileContent = lines.slice(1).join("\n");
    }

    // Write the modified content to a temporary file
    const tempFilePath = path.join(__dirname, "temp_stops.txt");
    fs.writeFileSync(tempFilePath, fileContent);

    // Convert CSV to JSON
    const jsonArray = await csv().fromFile(tempFilePath);

    // Write JSON to file
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonArray, null, 2));

    // Remove temporary file
    fs.unlinkSync(tempFilePath);

    console.log(`Successfully converted stops.txt to JSON: ${outputFilePath}`);
  } catch (error) {
    console.error("Error converting CSV to JSON:", error);
  }
})();
