import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, LeafletMouseEvent, Icon } from 'leaflet';
import './App.css';

// Fix for default marker icon issue with leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Bike icon for vehicle
const bikeIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + '/bike.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function LocationMarker({ onLocationSelect }: { onLocationSelect: (latlng: {lat: number, lng: number}) => void }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

const TILE_LAYERS = {
  Standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  Satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

// Route coordinates from GeoJSON (Indore to Bhopal via roadways)
const geojsonCoords: [number, number][] = [];

// Convert [lat, lng] to [lng, lat] as needed by Leaflet
const DUMMY_ROUTE: [number, number][] = geojsonCoords.map(([lat, lng]) => [lng, lat]);

function App() {
  const [shopLocation, setShopLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<'Standard' | 'Satellite'>('Standard');
  const [vehicleIdx, setVehicleIdx] = useState<number>(0);
  const vehicleTimer = useRef<NodeJS.Timeout | null>(null);

  // New: Search box states
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startPoint, setStartPoint] = useState<{ lat: number, lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number, lng: number } | null>(null);

  // Autocomplete for place search
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Fetch suggestions from Nominatim with error handling
  const fetchSuggestions = async (query: string, setSuggestions: (s: any[]) => void) => {
    if (!query) { setSuggestions([]); return; }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query + ', India')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Nominatim fetch failed');
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      setSuggestions([]);
      console.error('Suggestion fetch error:', err);
      // Optionally, show a user-friendly error message here
    }
  };

  useEffect(() => {
    if (startQuery) fetchSuggestions(startQuery, setStartSuggestions);
    else setStartSuggestions([]);
  }, [startQuery]);
  useEffect(() => {
    if (endQuery) fetchSuggestions(endQuery, setEndSuggestions);
    else setEndSuggestions([]);
  }, [endQuery]);

  // Search handler using Nominatim geocoding API
  const geocode = async (query: string): Promise<{ lat: number, lng: number } | null> => {
    if (!query) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  };

  // Center map on Indore and zoom in
  const mapCenter: LatLngExpression = [22.7196, 75.8577];

  // --- Vehicle live location update with correct position logic ---
  // If startPoint and endPoint are set, use the closest indices in geojsonCoords
  useEffect(() => {
    if (!startPoint || !endPoint) return;
    // Find closest indices in geojsonCoords for start and end
    const findClosestIdx = (pt: {lat: number, lng: number}) => {
      let minDist = Infinity, minIdx = 0;
      geojsonCoords.forEach(([lat, lng], idx) => {
        const dist = Math.hypot(lat - pt.lat, lng - pt.lng);
        if (dist < minDist) { minDist = dist; minIdx = idx; }
      });
      return minIdx;
    };
    const startIdx = findClosestIdx(startPoint);
    const endIdx = findClosestIdx(endPoint);
    // If end before start, swap
    let routeSlice;
    if (startIdx <= endIdx) routeSlice = geojsonCoords.slice(startIdx, endIdx + 1);
    else routeSlice = geojsonCoords.slice(endIdx, startIdx + 1).reverse();
    setRoute(routeSlice);
    setVehicleIdx(0);
  }, [startPoint, endPoint]);

  // Route state for vehicle
  const [route, setRoute] = useState<[number, number][]>([]);
  const vehiclePosition = route.length > 0 && route[vehicleIdx]
    ? { lat: route[vehicleIdx][0], lng: route[vehicleIdx][1] }
    : null;

  // Vehicle timer for live simulation
  useEffect(() => {
    if (!route.length) return;
    vehicleTimer.current = setInterval(() => {
      setVehicleIdx(idx => (idx + 1 < route.length ? idx + 1 : idx));
    }, 2000);
    return () => { if (vehicleTimer.current) clearInterval(vehicleTimer.current); };
  }, [route]);

  // Helper function to fetch route via GraphHopper
  const getRouteGraphHopper = async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
    const apiKey = process.env.REACT_APP_GRAPHHOPPER_KEY;
    const url = `https://graphhopper.com/api/1/route?point=${start.lat},${start.lng}&point=${end.lat},${end.lng}&vehicle=car&locale=en&key=${apiKey}&points_encoded=false&type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch route from GraphHopper');
    const data = await res.json();
    // data.paths[0].points.coordinates is [ [lng, lat], ... ]
    return data.paths[0].points.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
  };

  // Add loading state
  const [loadingRoute, setLoadingRoute] = useState(false);

  // State to hold last clicked map coordinates
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null);

  // State to show shop coordinate
  const [showShopCoord, setShowShopCoord] = useState(false);

  // --- Bike Follower Component ---
  function BikeFollower({ position }: { position: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
      if (position) {
        map.setView([position.lat, position.lng], 16, { animate: true });
      }
    }, [position, map]);
    return null;
  }

  return (
    <div className="App">
      {/* --- GitHub Ribbon --- */}
      <a href="https://github.com/narendraraghuwanshi/react-geolocation" target="_blank" rel="noopener noreferrer" style={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 2000,
      }}>
        <img src="https://github.blog/wp-content/uploads/2008/12/forkme_right_darkblue_121621.png?resize=149%2C149" alt="Fork me on GitHub" style={{ width: 120, height: 120 }} />
      </a>
      <header className="App-header">
        {/* Removed top title as requested */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={startQuery}
              placeholder="Search start location"
              onChange={e => {
                setStartQuery(e.target.value);
                setShowStartSuggestions(true);
              }}
              style={{ width: 200, padding: 4 }}
              onFocus={() => setShowStartSuggestions(true)}
              autoComplete="off"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute',
                left: 0,
                top: '100%',
                width: '200px',
                background: '#fff',
                border: '1px solid #d1d5db',
                zIndex: 1000,
                padding: 0,
                margin: 0,
                listStyle: 'none',
                maxHeight: '160px',
                overflowY: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)'
              }}>
                {startSuggestions.map((s, i) => (
                  <li key={i} style={{ padding: '8px 12px', cursor: 'pointer', color: '#111', fontSize: '13px' }}
                    onMouseDown={() => {
                      setStartQuery(s.display_name);
                      setStartPoint({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                      setShowStartSuggestions(false);
                    }}>
                    <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={endQuery}
              placeholder="Search end location"
              onChange={e => {
                setEndQuery(e.target.value);
                setShowEndSuggestions(true);
              }}
              style={{ width: 200, padding: 4 }}
              onFocus={() => setShowEndSuggestions(true)}
              autoComplete="off"
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute',
                left: 0,
                top: '100%',
                width: '200px',
                background: '#fff',
                border: '1px solid #d1d5db',
                zIndex: 1000,
                padding: 0,
                margin: 0,
                listStyle: 'none',
                maxHeight: '160px',
                overflowY: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)'
              }}>
                {endSuggestions.map((s, i) => (
                  <li key={i} style={{ padding: '8px 12px', cursor: 'pointer', color: '#111', fontSize: '13px' }}
                    onMouseDown={() => {
                      setEndQuery(s.display_name);
                      setEndPoint({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                      setShowEndSuggestions(false);
                    }}>
                    <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            style={{
              padding: '8px 20px',
              background: startPoint && endPoint ? '#2563eb' : '#cbd5e1',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1rem',
              border: 'none',
              cursor: startPoint && endPoint ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginLeft: 16
            }}
            disabled={!(startPoint && endPoint)}
            onClick={async () => {
              if (startPoint && endPoint) {
                try {
                  setLoadingRoute(true);
                  const routeCoords = await getRouteGraphHopper(startPoint, endPoint);
                  setRoute(routeCoords);
                  setVehicleIdx(0);
                } catch (e) {
                  alert('Failed to fetch route from GraphHopper.');
                } finally {
                  setLoadingRoute(false);
                }
              }
            }}
          >{loadingRoute ? 'Loading...' : 'Show Live'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 32 }}>
          {/* Map Section */}
          <div style={{ position: 'relative' }}>
            <div style={{ height: '700px', width: '1200px', marginBottom: '1rem', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', border: '1px solid #e5e7eb', background: '#fff', position: 'relative' }}>
              {/* Map View switcher at bottom left */}
              <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 1200, display: 'flex', alignItems: 'center' }}>
                <label htmlFor="map-type-select" style={{ marginRight: 8 }}>Map View:</label>
                <select
                  id="map-type-select"
                  value={mapType}
                  onChange={e => setMapType(e.target.value as 'Standard' | 'Satellite')}
                  style={{ fontSize: '1rem', padding: '4px 8px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontWeight: 600 }}
                >
                  <option value="Standard">Standard</option>
                  <option value="Satellite">Satellite</option>
                </select>
                {/* Show Shop Coordinate button */}
                <button onClick={() => setShowShopCoord(sc => !sc)} style={{ marginLeft: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Show Shop Coordinate</button>
              </div>
              <MapContainer
                center={vehiclePosition ? [vehiclePosition.lat, vehiclePosition.lng] : [22.7196, 75.8577]}
                zoom={13}
                style={{ height: '690px', width: '1200px', borderRadius: '2rem' }}
              >
                <TileLayer
                  url={TILE_LAYERS[mapType].url}
                  attribution={TILE_LAYERS[mapType].attribution}
                />
                {/* Listen for map clicks and update clickedCoord */}
                <LocationMarker onLocationSelect={latlng => setClickedCoord(latlng)} />
                {/* Route polyline from start to end */}
                {route.length > 0 && <Polyline positions={route.map(([lat, lng]) => [lat, lng])} color="blue" weight={4} />}
                {vehiclePosition && <BikeFollower position={vehiclePosition} />}
                {/* Vehicle Live Location Marker with Bike Icon */}
                {vehiclePosition && (
                  <Marker position={vehiclePosition} icon={bikeIcon}>
                    <Popup>
                      Vehicle Live Location<br />
                      Lat: {vehiclePosition.lat.toFixed(5)}, Lng: {vehiclePosition.lng.toFixed(5)}
                    </Popup>
                  </Marker>
                )}
                {/* Shop coordinate marker if toggled and shopLocation exists */}
                {showShopCoord && shopLocation && (
                  <Marker position={[shopLocation.lat, shopLocation.lng]} icon={DefaultIcon}>
                    <Popup>
                      Shop Coordinate<br />
                      Lat: {shopLocation.lat.toFixed(5)}, Lng: {shopLocation.lng.toFixed(5)}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
              {/* Show last clicked coordinate below the map, inline */}
              {clickedCoord && (
                <div style={{ marginTop: 8, fontSize: 15, color: '#0f172a', textAlign: 'left' }}>
                  Clicked coordinate: <b>Lat:</b> {clickedCoord.lat.toFixed(6)}, <b>Lng:</b> {clickedCoord.lng.toFixed(6)}
                </div>
              )}
            </div>
          </div>
          {/* Right Side: Coordinates List */}
          {route.length > 0 && (
            <div style={{ width: 340, background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb', maxHeight: 700, overflowY: 'auto', boxSizing: 'border-box' }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#334155' }}>Route Coordinates</h3>
              <div style={{ fontSize: 13, color: '#334155' }}>
                {route.map((c, i) => (
                  <div key={i} style={{
                    background: vehicleIdx === i ? '#2563eb' : '#fff',
                    color: vehicleIdx === i ? '#fff' : '#334155',
                    borderRadius: 6,
                    padding: '4px 8px',
                    marginBottom: 4,
                    border: vehicleIdx === i ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    fontWeight: vehicleIdx === i ? 700 : 400,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    #{i + 1}: ({c[0].toFixed(5)}, {c[1].toFixed(5)})
                    {vehicleIdx === i && <span style={{ marginLeft: 8, fontWeight: 700 }}>&larr; Bike Here</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
