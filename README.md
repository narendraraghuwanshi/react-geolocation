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

---

## ⭐ GitHub
[![Fork me on GitHub](https://github.blog/wp-content/uploads/2008/12/forkme_right_darkblue_121621.png?resize=149%2C149)](https://github.com/narendraraghuwanshi/react-geolocation)

---

### License
MIT

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
