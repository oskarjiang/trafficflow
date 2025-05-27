const fs = require("fs");
const path = require("path");

// Configuration
const INPUT_FILE = path.join(__dirname, "..", "gtfs_vt", "stop_times.txt");
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "gtfs_vt",
  "stop_times_segments"
);
const LINES_PER_SEGMENT = 100000; // Adjust based on your needs

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`Reading file: ${INPUT_FILE}`);
const content = fs.readFileSync(INPUT_FILE, "utf8");
const lines = content.split("\n");
const header = lines[0];

// Calculate number of segments
const dataLines = lines.length - 1;
const totalSegments = Math.ceil(dataLines / LINES_PER_SEGMENT);

console.log(`File has ${lines.length} lines (${dataLines} data lines)`);
console.log(
  `Splitting into ${totalSegments} segments with ~${LINES_PER_SEGMENT} lines each`
);

// Generate segment info
const segmentsInfo = {
  totalSegments,
  totalLines: lines.length,
  dataLines,
  linesPerSegment: LINES_PER_SEGMENT,
  segments: [],
};

// Split the file
for (let i = 0; i < totalSegments; i++) {
  const filename = `stop_times_part${i + 1}.txt`;
  const segmentLines = [];

  // Add header to first segment
  if (i === 0) {
    segmentLines.push(header);
  }

  // Calculate start and end lines for this segment
  const startLine = i * LINES_PER_SEGMENT + 1; // +1 to skip header
  const endLine = Math.min((i + 1) * LINES_PER_SEGMENT + 1, lines.length);

  // Add lines for this segment
  for (let j = startLine; j < endLine; j++) {
    if (lines[j].trim()) {
      segmentLines.push(lines[j]);
    }
  }

  // Write segment file
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, segmentLines.join("\n"));

  // Add segment info
  segmentsInfo.segments.push({
    filename,
    index: i,
  });

  console.log(`Created segment ${i + 1}/${totalSegments}: ${filename}`);
}

// Write segments info file
const infoPath = path.join(OUTPUT_DIR, "segments_info.json");
fs.writeFileSync(infoPath, JSON.stringify(segmentsInfo, null, 2));

console.log(`Done! Created ${totalSegments} segments and segments_info.json`);
