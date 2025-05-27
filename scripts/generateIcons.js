const fs = require("fs");
const path = require("path");
const svg2png = require("svg2png");

// Read SVG file
const svgBuffer = fs.readFileSync(
  path.join(__dirname, "../public/trafficflow_icon.svg")
);

// Convert to different sizes for PWA icons
async function generateIcons() {
  try {
    // Generate 16x16 favicon (will overwrite existing)
    const favicon16 = await svg2png(svgBuffer, { width: 16, height: 16 });
    fs.writeFileSync(path.join(__dirname, "../public/favicon.ico"), favicon16);
    console.log("Created favicon.ico");

    // Generate 192x192 icon for PWA
    const icon192 = await svg2png(svgBuffer, { width: 192, height: 192 });
    fs.writeFileSync(path.join(__dirname, "../public/logo192.png"), icon192);
    console.log("Created logo192.png");

    // Generate 512x512 icon for PWA
    const icon512 = await svg2png(svgBuffer, { width: 512, height: 512 });
    fs.writeFileSync(path.join(__dirname, "../public/logo512.png"), icon512);
    console.log("Created logo512.png");

    console.log("All icons generated successfully!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

generateIcons();
