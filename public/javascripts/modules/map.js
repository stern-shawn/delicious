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

      // Create map bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      // Create our list of markers to render to the map
      const markers = places.map((place) => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // Show details of a marker when it is clicked
      markers.forEach(marker => marker.addListener('click', function markerInfo() {
        const place = this.place;
        const html = `
          <div class="popup">
            <a href="/store/${place.slug}">
              <img src="/uploads/${place.photo || 'store.png'}" alt="${place.name}"/>
              <p>${place.name} - ${place.location.address}</p>
            </a>
          </div>`;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // Center and zoom map to fit our markers
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;

  // Generate the map and store reference to it
  const map = new google.maps.Map(mapDiv, mapConfig);
  loadPlaces(map);

  // Enable Google Maps autocomplete for the input
  // Query our API + update our map when a new location is selected
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;
