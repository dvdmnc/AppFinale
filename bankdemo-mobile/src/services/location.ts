import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface ATM {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<Coords> {
    const loc = await Location.getCurrentPositionAsync({});
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  },

  sortByDistance(atms: ATM[], userCoords: Coords): ATM[] {
    return atms
      .map((atm) => ({
        ...atm,
        distance: haversine(userCoords, { latitude: atm.latitude, longitude: atm.longitude }),
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  },
};

function haversine(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
