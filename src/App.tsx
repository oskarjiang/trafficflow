import React, { useState } from "react";
import "./App.css";
import StopsMap from "./components/StopsMap";
import ShapesMap from "./components/ShapesMap";

function App() {
  const [showShapes, setShowShapes] = useState<boolean>(true);

  return (
    <div className="App">
      <header className="App-header">
        <h1>TrafficFlow - Transit Visualization</h1>
        <div className="view-toggle">
          <button
            onClick={() => setShowShapes(false)}
            className={!showShapes ? "active" : ""}
          >
            View Stops
          </button>
          <button
            onClick={() => setShowShapes(true)}
            className={showShapes ? "active" : ""}
          >
            View Shapes
          </button>
        </div>
      </header>
      <main>{showShapes ? <ShapesMap /> : <StopsMap />}</main>
      <footer>
        <p>Data from GTFS feed - Västtrafik</p>
      </footer>
    </div>
  );
}

export default App;
