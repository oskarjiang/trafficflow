// Transit icon generator script
const fs = require("fs");
const path = require("path");
const svg2png = require("svg2png");

// Read SVG file
const svgBuffer = fs.readFileSync(
  path.join(__dirname, "../public/transit_vehicle_icon.svg")
);

// Convert to different sizes for PWA icons
async function generateIcons() {
  try {
    console.log("Generating transit icons...");

    // Create favicon.ico size
    const favicon = await svg2png(svgBuffer, { width: 64, height: 64 });
    fs.writeFileSync(
      path.join(__dirname, "../public/transit_favicon.ico"),
      favicon
    );
    console.log("Generated transit_favicon.ico");

    // Create logo192.png
    const logo192 = await svg2png(svgBuffer, { width: 192, height: 192 });
    fs.writeFileSync(
      path.join(__dirname, "../public/transit_logo192.png"),
      logo192
    );
    console.log("Generated transit_logo192.png");

    // Create logo512.png
    const logo512 = await svg2png(svgBuffer, { width: 512, height: 512 });
    fs.writeFileSync(
      path.join(__dirname, "../public/transit_logo512.png"),
      logo512
    );
    console.log("Generated transit_logo512.png");

    console.log("All transit icons generated successfully!");
  } catch (error) {
    console.error("Error generating transit icons:", error);
  }
}

generateIcons();
