import React from "react";
import "./App.css";
import StopsMap from "./components/StopsMap";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TrafficFlow - Transit Stops Visualization</h1>
      </header>
      <main>
        <StopsMap />
      </main>
      <footer>
        <p>Data from GTFS feed - Västtrafik</p>
      </footer>
    </div>
  );
}

export default App;
