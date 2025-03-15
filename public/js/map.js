/* eslint-disable */

/*
// Creating an icon instead of images for marker
const htmlIcon = L.divIcon({
  className: 'custom-marker',
  html:
    '<div style="background: #4CAF50; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">!</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12] // Point of the icon that corresponds to the marker's location
});
*/

const customIcon = L.icon({
  iconUrl: '/img/pin.png',
  className: 'marker',
  html: '<div></div>'
});

// After Document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('map');

  // Get locations from data attribute
  const locations = JSON.parse(mapEl.dataset.locations);

  if (!locations || locations.length === 0) {
    mapEl.innerHTML = '<p class="error">No locations available</p>';
    return;
  }

  // Create array of coordinates (for animation)
  const coordinates = locations.map(loc => [
    // mongodb stores [lng,lat]
    loc.coordinates[1], // lat
    loc.coordinates[0] // lng
  ]);

  // Create bounds that contain all locations (locations will be bounded)
  const bounds = L.latLngBounds(coordinates);

  // Create map with initial zoomed-out view
  const map = L.map('map', {
    minZoom: 3,
    maxZoom: 18,
    zoomControl: true
  }).fitWorld(); // Start with whole world view

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Add markers
  const markers = locations.map(
    loc =>
      L.marker([loc.coordinates[1], loc.coordinates[0]], {
        icon: customIcon
      }).bindPopup(`Day ${loc.day}, ${loc.description}`, {
        offset: L.point(15, 15)
      }) // Additional offset);
  );

  // Create marker group
  const markerGroup = L.featureGroup(markers).addTo(map);

  // Animated zoom function
  function animatedZoom() {
    map.flyToBounds(bounds, {
      padding: [100, 100], // Add 100px padding
      duration: 2, // 2-second animation
      easeLinearity: 0.25 // Smooth easing
    });

    map.once('moveend', () => {
      if (markers.length > 0) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          markers[0].openPopup();
        }, 300);
      }
    });
  }

  // Initial zoom after short delay
  setTimeout(() => {
    animatedZoom();
  }, 500);
});
