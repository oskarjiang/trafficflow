# TrafficFlow
https://trafficflow.oskarjiang.se/

# Local development
1.  Get API key for GTFS Regional Static data from https://developer.trafiklab.se/project/list
1. Download ZIP from https://opendata.samtrafiken.se/gtfs/vt/vt.zip?key=API_KEY
1. Put contents in _gtfs_vt_
1. `node scripts/splitShapesFile.js`
1. `npm install`
1. `npm start`
