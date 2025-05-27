import React, { useState } from "react";
import "./App.css";
import StopsMap from "./components/StopsMap";
import ShapesMap from "./components/ShapesMap";
import StopTimesMap from "./components/StopTimesMap";

type ViewMode = "stops" | "shapes" | "stopTimes";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>();

  return (
    <div className="App">
      <header className="App-header">
        <h1>TrafficFlow - Transit Visualization</h1>
        <div className="view-toggle">
          <button
            onClick={() => setViewMode("stops")}
            className={viewMode === "stops" ? "active" : ""}
          >
            View Stops
          </button>
          <button
            onClick={() => setViewMode("shapes")}
            className={viewMode === "shapes" ? "active" : ""}
          >
            View Shapes
          </button>
          <button
            onClick={() => setViewMode("stopTimes")}
            className={viewMode === "stopTimes" ? "active" : ""}
          >
            View Stop Times
          </button>
        </div>
      </header>
      <main>
        {viewMode === "shapes" ? (
          <ShapesMap />
        ) : viewMode === "stopTimes" ? (
          <StopTimesMap />
        ) : viewMode === "stops" ? (
          <StopsMap />
        ) : (
          <div />
        )}
      </main>
      <footer>
        <p>Data from GTFS feed - Västtrafik</p>
      </footer>
    </div>
  );
}

export default App;
