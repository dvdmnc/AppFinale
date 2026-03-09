/**
 * Location service unit tests — Red phase.
 * Tests permission request, geolocation, and haversine distance sorting.
 */
import { locationService, ATM } from '../src/services/location';
import * as Location from 'expo-location';

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request permission and return true when granted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    const result = await locationService.requestPermission();
    expect(result).toBe(true);
  });

  it('should return false when permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await locationService.requestPermission();
    expect(result).toBe(false);
  });

  it('should get current location coordinates', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 48.8566, longitude: 2.3522 },
    });

    const coords = await locationService.getCurrentLocation();
    expect(coords.latitude).toBeCloseTo(48.8566);
    expect(coords.longitude).toBeCloseTo(2.3522);
  });

  it('should sort ATMs by distance from user', () => {
    const userCoords = { latitude: 48.8566, longitude: 2.3522 };
    const atms: ATM[] = [
      { id: '1', name: 'Far ATM', latitude: 48.9, longitude: 2.4 },
      { id: '2', name: 'Near ATM', latitude: 48.857, longitude: 2.353 },
      { id: '3', name: 'Mid ATM', latitude: 48.87, longitude: 2.37 },
    ];

    const sorted = locationService.sortByDistance(atms, userCoords);

    expect(sorted[0].name).toBe('Near ATM');
    expect(sorted[sorted.length - 1].name).toBe('Far ATM');
    // All should have distance property
    sorted.forEach((atm) => {
      expect(atm.distance).toBeDefined();
      expect(atm.distance).toBeGreaterThanOrEqual(0);
    });
  });

  it('should calculate zero distance for same point', () => {
    const point = { latitude: 48.8566, longitude: 2.3522 };
    const atms: ATM[] = [{ id: '1', name: 'Same', latitude: 48.8566, longitude: 2.3522 }];

    const sorted = locationService.sortByDistance(atms, point);
    expect(sorted[0].distance).toBeCloseTo(0, 1);
  });
});
