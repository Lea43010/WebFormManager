// Type definitions for Google Maps JavaScript API

declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google {
    namespace maps {
      class Map {
        constructor(element: Element, options?: MapOptions);
        setCenter(center: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        getCenter(): LatLng;
        getZoom(): number;
      }

      class Marker {
        constructor(options?: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng | LatLngLiteral): void;
        getPosition(): LatLng;
        setTitle(title: string): void;
        getTitle(): string;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        zoomControl?: boolean;
      }

      interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        icon?: string | Icon;
        label?: string | MarkerLabel;
        draggable?: boolean;
      }

      interface Icon {
        url: string;
        scaledSize?: Size;
        size?: Size;
        origin?: Point;
        anchor?: Point;
      }

      class Size {
        constructor(width: number, height: number);
        width: number;
        height: number;
      }

      class Point {
        constructor(x: number, y: number);
        x: number;
        y: number;
      }

      interface MarkerLabel {
        text: string;
        color?: string;
        fontWeight?: string;
        fontSize?: string;
      }
    }
  }
}

export {};