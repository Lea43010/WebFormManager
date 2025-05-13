// Global Jest setup Datei
import '@testing-library/jest-dom';

// Globale Mock-Definitionen für Tests

// Mock für Window-Objekte
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock für den Storage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock für Leaflet und Mapbox
jest.mock('leaflet', () => ({
  map: jest.fn(),
  tileLayer: jest.fn(),
  marker: jest.fn(),
  circle: jest.fn(),
  DivIcon: jest.fn().mockImplementation(() => ({})),
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: jest.fn()
      },
      mergeOptions: jest.fn()
    }
  }
}));

// Mock für Google Maps API
class MockGeometry {
  static spherical = {
    computeDistanceBetween: jest.fn().mockReturnValue(1000) // 1000 Meter
  };
}

class MockLatLng {
  constructor(public lat: number, public lng: number) {}
  
  toJSON() {
    return { lat: this.lat, lng: this.lng };
  }
}

class MockMap {
  addListener = jest.fn();
  setCenter = jest.fn();
  setZoom = jest.fn();
  getCenter = jest.fn().mockReturnValue(new MockLatLng(48.137154, 11.576124));
  getZoom = jest.fn().mockReturnValue(12);
}

class MockMarker {
  setMap = jest.fn();
  getPosition = jest.fn().mockReturnValue(new MockLatLng(48.137154, 11.576124));
  addListener = jest.fn();
}

class MockDirectionsService {
  route = jest.fn().mockImplementation((request, callback) => {
    callback({
      status: 'OK',
      routes: [{
        legs: [{
          start_address: 'München, Deutschland',
          end_address: 'Berlin, Deutschland',
          distance: { value: 500000, text: '500 km' }
        }],
        overview_path: [
          { lat: 48.137154, lng: 11.576124 },
          { lat: 52.520008, lng: 13.404954 }
        ]
      }]
    }, 'OK');
  });
}

class MockDirectionsRenderer {
  setMap = jest.fn();
  setDirections = jest.fn();
  setOptions = jest.fn();
}

class MockPlacesService {
  findPlaceFromQuery = jest.fn().mockImplementation((request, callback) => {
    callback([{
      geometry: {
        location: new MockLatLng(48.137154, 11.576124)
      }
    }], 'OK');
  });
}

const mockGoogleMaps = {
  Map: MockMap,
  Marker: MockMarker,
  LatLng: MockLatLng,
  geometry: MockGeometry,
  DirectionsService: MockDirectionsService,
  DirectionsRenderer: MockDirectionsRenderer,
  places: {
    PlacesService: MockPlacesService,
    PlacesServiceStatus: {
      OK: 'OK'
    }
  },
  DirectionsStatus: {
    OK: 'OK'
  }
};

// Setze google.maps Objekt
global.google = {
  maps: mockGoogleMaps
} as any;

// Bereinige eventuelle Timer nach jedem Test
afterEach(() => {
  jest.useRealTimers();
});