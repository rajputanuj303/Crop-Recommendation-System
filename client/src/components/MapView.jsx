import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function LocationMarker({ setPosition, position }) {
  const [localPosition, setLocalPosition] = React.useState(position);

  React.useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  useMapEvents({
    click(e) {
      setLocalPosition(e.latlng);
      setPosition && setPosition(e.latlng);
    },
    locationfound(e) {
      setLocalPosition(e.latlng);
      setPosition && setPosition(e.latlng);
    },
  });

  React.useEffect(() => {
    if (!position && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setLocalPosition({ lat: latitude, lng: longitude });
        setPosition && setPosition({ lat: latitude, lng: longitude });
      });
    }
  }, [position, setPosition]);

  return localPosition == null ? null : (
    <Marker position={localPosition}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

const MapView = ({ setPosition, position }) => {
  return (
    <div style={{ height: "400px", width: "100%", margin: "1rem 0" }}>
      <MapContainer center={position || [20.5937, 78.9629]} zoom={position ? 13 : 5} style={{ height: "100%", width: "100%" }}>
        {/* Satellite view from Esri */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
        <LocationMarker setPosition={setPosition} position={position} />
      </MapContainer>
    </div>
  );
};

export default MapView;
