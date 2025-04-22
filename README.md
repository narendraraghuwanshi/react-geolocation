# 🚴 Live Bike Tracking App (React + Leaflet)

This app provides real-time bike tracking on a map between two user-selected locations, with a modern UI and live route following.

### Features
- **Live Bike Tracking:**
  - Click "Show Live" after searching start and end locations to fetch a real route from GraphHopper and animate the bike along it.
  - The map zooms in and follows the bike as it moves.
  - Only one bike marker is shown at all times.
- **Location Search:**
  - Start and end locations are searched using Nominatim with autocomplete suggestions.
- **Route Display:**
  - The actual route coordinates are fetched from GraphHopper Directions API.
  - A right-side panel lists all route coordinates, highlighting the current bike position.
- **Modern UI:**
  - Clean layout with a map and a side panel for route details.
  - Responsive and visually appealing.
- **GitHub Ribbon:**
  - A GitHub ribbon at the top links directly to the repository code.

### Setup & Usage
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the app:**
   ```bash
   npm start
   ```
3. **Get a GraphHopper API key:**
   - Register at [GraphHopper](https://www.graphhopper.com/products/) and use your free API key in the code.

### Tech Stack
- **React** (with TypeScript)
- **Leaflet** (react-leaflet)
- **GraphHopper Directions API** (for real route fetching)
- **Nominatim API** (for geocoding & suggestions)

### How It Works
- Enter start and end locations in the search boxes.
- Click "Show Live" to fetch the route and animate the bike.
- The map will follow the bike and zoom in.
- See the route's coordinates and the bike's current position in the side panel.

### Customization
- Change the map style (Standard/Satellite) using the dropdown.
- Adjust the animation speed or zoom level in the code if needed.


### License
MIT

