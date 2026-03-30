import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation';
import { getServerTypes, getImages, createServer } from '../../api/servers';
import { getLocations } from '../../api/locations';
import { useServerStore } from '../../store/serverStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { Location, ServerType, Image } from '../../models';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateServer'>;

const OS_FLAVORS = ['ubuntu', 'debian', 'centos', 'alma', 'rocky', 'fedora', 'opensuse'];

export default function CreateServerScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [serverTypes, setServerTypes] = useState<ServerType[]>([]);
  const [images, setImages] = useState<Image[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const { refreshServers } = useServerStore();

  useEffect(() => {
    Promise.all([getLocations(), getServerTypes(), getImages('system')]).then(([locs, types, imgs]) => {
      setLocations(locs);
      setServerTypes(types);
      setImages(imgs.filter(i => OS_FLAVORS.includes(i.os_flavor)));
      setSelectedLocation(locs[0]?.name ?? null);
      setSelectedType(types[0]?.name ?? null);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a server name'); return; }
    if (!selectedType || !selectedImage || !selectedLocation) { Alert.alert('Error', 'Please fill all required fields'); return; }

    setCreating(true);
    try {
      await createServer({
        name: name.trim(),
        server_type: selectedType,
        image: selectedImage,
        location: selectedLocation,
      });
      await refreshServers();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  // Group images by OS flavor
  const imagesByFlavor = OS_FLAVORS.map(flavor => ({
    flavor,
    images: images.filter(i => i.os_flavor === flavor),
  })).filter(g => g.images.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Server</Text>
        <TouchableOpacity onPress={handleCreate} disabled={creating}>
          {creating
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={styles.createText}>Create</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="my-server"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.optionGrid}>
            {locations.map(loc => (
              <TouchableOpacity
                key={loc.id}
                style={[styles.optionCard, selectedLocation === loc.name && styles.optionCardSelected]}
                onPress={() => setSelectedLocation(loc.name)}
              >
                <Text style={styles.optionTitle}>{loc.city}</Text>
                <Text style={styles.optionSub}>{loc.network_zone}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>IMAGE</Text>
          <View style={styles.optionGrid}>
            {imagesByFlavor.map(({ flavor, images: flavorImages }) => {
              const latestImage = flavorImages[0];
              const isSelected = selectedImage === latestImage.id;
              return (
                <TouchableOpacity
                  key={flavor}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedImage(latestImage.id)}
                >
                  <Text style={styles.optionTitle}>{capitalize(flavor)}</Text>
                  <Text style={styles.optionSub}>{latestImage.os_version ?? ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Server Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVER TYPE</Text>
          {serverTypes.slice(0, 10).map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeRow, selectedType === type.name && styles.typeRowSelected]}
              onPress={() => setSelectedType(type.name)}
            >
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name.toUpperCase()}</Text>
                <Text style={styles.typeSpecs}>{type.cores} vCPU · {type.memory} GB RAM · {type.disk} GB Disk</Text>
              </View>
              {selectedType === type.name && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  cancelText: { color: Colors.primary, fontSize: 17 },
  title: { ...Typography.h3 },
  createText: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600' },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.label },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 15,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: '47%',
  },
  optionCardSelected: { borderColor: Colors.primary },
  optionTitle: { ...Typography.body, fontWeight: '600' },
  optionSub: { ...Typography.bodySmall, marginTop: 2 },
  typeRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeRowSelected: { borderColor: Colors.primary },
  typeInfo: { flex: 1 },
  typeName: { ...Typography.body, fontWeight: '600' },
  typeSpecs: { ...Typography.bodySmall, marginTop: 2 },
  checkmark: { color: Colors.primary, fontSize: 18, fontWeight: '700' },
});
