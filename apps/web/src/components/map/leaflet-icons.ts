import L from 'leaflet';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

let isInitialized = false;

/**
 * Patches Leaflet default icon paths to use Vite-resolved hashed asset URLs.
 * Must be executed before rendering any Leaflet map instance.
 */
export function initLeafletIcons(): void {
  if (isInitialized) return;

  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: markerIconUrl,
    iconRetinaUrl: markerIcon2xUrl,
    shadowUrl: markerShadowUrl,
  });

  isInitialized = true;
}
