import axios from 'axios';
import { $ } from './bling';

const mapConfig = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 8,
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then((res) => {
      const places = res.data;
      if (!places.length) {
        alert('no places found');
        return;
      }

      const markers = places.map((place) => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  // Generate the map and store reference to it
  const map = new google.maps.Map(mapDiv, mapConfig);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);


}

export default makeMap;
