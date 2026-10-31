import { createContext, useContext } from 'react';
import type L from 'leaflet';

export const MapContext = createContext<L.Map | null>(null);
export const useMapInstance = (): L.Map | null => useContext(MapContext);
