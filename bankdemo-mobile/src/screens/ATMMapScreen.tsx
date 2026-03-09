import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useThemeColors, useThemeContext, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { locationService, type ATM, type Coords } from '../services/location';
import { api } from '../services/api';
import { SearchInput } from '../components/ui/Input';
import { ATMCard, type ATMData } from '../components/ui/Cards';
import { MapPinIcon, ArrowBackIcon } from '../components/icons/BankIcons';

// Fallback: Lyon center
const LYON: Coords = { latitude: 45.7640, longitude: 4.8357 };

interface ATMWithCoords extends ATMData {
  latitude?: number;
  longitude?: number;
}

export default function ATMMapScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { isDark } = useThemeContext();
  const mapRef = useRef<MapView>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [atms, setAtms] = useState<ATMWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedATM, setSelectedATM] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const granted = await locationService.requestPermission();
        const coords = granted ? await locationService.getCurrentLocation() : LYON;
        setUserCoords(coords);

        try {
          const res = await api.get<{ data: any[] }>(
            `/atms/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=10`,
          );
          const sorted = locationService.sortByDistance(res.data, coords);
          setAtms(
            sorted.map((a: any) => ({
              id: String(a.id),
              name: a.name,
              address: a.address || '',
              distance: a.distance_km ? parseFloat(a.distance_km).toFixed(1) : (a.distance ?? 0),
              available24h: a.available_24h ?? false,
              services: a.services ? (typeof a.services === 'string' ? JSON.parse(a.services) : a.services) : [],
              latitude: a.latitude,
              longitude: a.longitude,
            })),
          );
        } catch {
          // No API data
        }
      } catch {
        setUserCoords(LYON);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredATMs = useMemo(
    () =>
      atms.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.address.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [atms, searchQuery],
  );

  const handleSelectATM = (id: string) => {
    setSelectedATM(id);
    const atm = atms.find((a) => a.id === id);
    if (atm?.latitude && atm?.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: atm.latitude,
        longitude: atm.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleDirections = (atm: ATMWithCoords) => {
    if (atm.latitude && atm.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${atm.latitude},${atm.longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Brand.primary} testID="loading-indicator" />
      </View>
    );
  }

  const region = userCoords ?? LYON;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.md }}>
          <Text style={[styles.title, { color: colors.text, flex: 1, marginBottom: 0 }]}>Distributeurs</Text>
        </View>
        <SearchInput
          placeholder="Rechercher un distributeur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        initialRegion={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        testID="atm-map"
      >
        {atms.filter((a) => a.latitude && a.longitude).map((atm) => (
          <Marker
            key={atm.id}
            coordinate={{ latitude: atm.latitude!, longitude: atm.longitude! }}
            title={atm.name}
            description={`${atm.distance} km`}
            pinColor={selectedATM === atm.id ? Brand.primary : 'red'}
            onPress={() => handleSelectATM(atm.id)}
          />
        ))}
      </MapView>

      {/* ATM counter */}
      <View style={[styles.atmCounter, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
          <Text style={{ color: Brand.primary }}>{filteredATMs.length}</Text> distributeurs à proximité
        </Text>
      </View>

      {/* ATM List */}
      <FlatList
        style={[styles.list, { backgroundColor: colors.background }]}
        data={filteredATMs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.base, gap: 10 }}
        renderItem={({ item }) => (
          <ATMCard
            atm={item}
            selected={selectedATM === item.id}
            onPress={() => handleSelectATM(item.id)}
            onDirections={() => handleDirections(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MapPinIcon size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Aucun distributeur trouvé</Text>
          </View>
        }
        testID="atm-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  backBox: {
    width: 40, height: 40, borderRadius: Radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h1, fontSize: 24 },
  map: { height: 250 },
  atmCounter: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: -20,
    zIndex: 1,
  },
  list: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
});
