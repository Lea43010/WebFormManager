declare global {
  interface Window {
    google: any;
    googleMap: any;
    mapMarkers: any[];
    polyline: any;
    initMap: () => void;
    addMapMarker: (position: any) => void;
    clearMapMarkers: () => void;
    updateMarkersCount: (count: number) => void;
    externalOnRouteChange: ((route: Array<{lat: number, lng: number}>) => void) | null;
    externalOnMarkersClear: (() => void) | null;
    mapInitialCenter: {lat: number, lng: number};
    mapInitialZoom: number;
  }
}

export {};