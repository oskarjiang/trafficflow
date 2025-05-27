const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Input and output paths
const inputFilePath = path.join(__dirname, "..", "gtfs_vt", "stops.txt");
const outputDir = path.join(
  __dirname,
  "..",
  "public",
  "gtfs_vt",
  "stops_segments"
);

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to count the total number of lines in the file
async function countLines() {
  let lineCount = 0;
  const fileStream = fs.createReadStream(inputFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;
  }

  return lineCount;
}

// Function to split the file into segments
async function splitFile(totalLines) {
  // Get the header line
  const firstLine = fs.readFileSync(inputFilePath, "utf8").split("\n")[0];

  // Calculate lines per segment (excluding header)
  const dataLines = totalLines - 1;
  // Split into 5 segments like shapes
  const numSegments = 5;
  const linesPerSegment = Math.ceil(dataLines / numSegments);

  console.log(`Total lines: ${totalLines}`);
  console.log(`Lines per segment: ${linesPerSegment}`);

  // Create the file streams
  const fileStream = fs.createReadStream(inputFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentSegment = 1;
  let lineIndex = 0;
  let outputStream = fs.createWriteStream(
    path.join(outputDir, `stops_part${currentSegment}.txt`)
  );

  // Write header to the first file
  outputStream.write(`${firstLine}\n`);

  // Process each line
  for await (const line of rl) {
    // Skip the header line since we've already written it
    if (lineIndex === 0) {
      lineIndex++;
      continue;
    }

    // Check if we need to start a new segment file
    if (
      lineIndex > 0 &&
      (lineIndex - 1) % linesPerSegment === 0 &&
      currentSegment < numSegments
    ) {
      // Close current file
      outputStream.end();

      // Increment segment counter
      currentSegment++;

      // Create new output stream
      outputStream = fs.createWriteStream(
        path.join(outputDir, `stops_part${currentSegment}.txt`)
      );

      // Write header to the new file
      outputStream.write(`${firstLine}\n`);

      console.log(`Started segment ${currentSegment}`);
    }

    // Write the line to the current output file
    outputStream.write(`${line}\n`);
    lineIndex++;
  }

  // Close the last file
  outputStream.end();
  console.log(`Completed splitting into ${currentSegment} segments`);

  // Create a metadata file with information about the segments
  const metadata = {
    totalSegments: numSegments,
    totalLines: totalLines,
    dataLines: dataLines,
    linesPerSegment: linesPerSegment,
    segments: Array.from({ length: numSegments }, (_, i) => ({
      filename: `stops_part${i + 1}.txt`,
      index: i + 1,
    })),
  };

  fs.writeFileSync(
    path.join(outputDir, "segments_info.json"),
    JSON.stringify(metadata, null, 2)
  );

  console.log("Created segments_info.json with metadata");
}

// Main execution
(async () => {
  try {
    console.log("Counting lines in stops.txt...");
    const totalLines = await countLines();

    console.log("Splitting file into segments...");
    await splitFile(totalLines);

    console.log("Done!");
  } catch (error) {
    console.error("Error splitting file:", error);
  }
})();
