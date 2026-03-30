import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-gifted-charts';

import type { RootStackParamList } from '../../navigation';
import { getServerMetrics } from '../../api/servers';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerMetrics'>;

type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d';

const RANGES: TimeRange[] = ['1h', '6h', '12h', '24h', '7d'];

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 3600000,
  '6h': 21600000,
  '12h': 43200000,
  '24h': 86400000,
  '7d': 604800000,
};

const RANGE_STEP: Record<TimeRange, number> = {
  '1h': 30,
  '6h': 120,
  '12h': 300,
  '24h': 600,
  '7d': 3600,
};

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing.lg * 2 - 2;

export default function ServerMetricsScreen({ route, navigation }: Props) {
  const { serverId } = route.params;
  const [range, setRange] = useState<TimeRange>('1h');
  const [cpuData, setCpuData] = useState<{ value: number }[]>([]);
  const [diskReadData, setDiskReadData] = useState<{ value: number }[]>([]);
  const [diskWriteData, setDiskWriteData] = useState<{ value: number }[]>([]);
  const [netInData, setNetInData] = useState<{ value: number }[]>([]);
  const [netOutData, setNetOutData] = useState<{ value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [range]);

  const loadMetrics = async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date(end.getTime() - RANGE_MS[range]);
    const step = RANGE_STEP[range];

    try {
      const [cpuMetrics, diskMetrics, netMetrics] = await Promise.all([
        getServerMetrics(serverId, 'cpu', start, end, step),
        getServerMetrics(serverId, 'disk', start, end, step),
        getServerMetrics(serverId, 'network', start, end, step),
      ]);

      setCpuData(
        (cpuMetrics.time_series?.cpu?.values ?? []).map(([, v]) => ({ value: parseFloat(v) }))
      );
      setDiskReadData(
        (diskMetrics.time_series?.['disk.0.bandwidth.read']?.values ?? []).map(([, v]) => ({ value: parseFloat(v) / 1024 }))
      );
      setDiskWriteData(
        (diskMetrics.time_series?.['disk.0.bandwidth.write']?.values ?? []).map(([, v]) => ({ value: parseFloat(v) / 1024 }))
      );
      setNetInData(
        (netMetrics.time_series?.['network.0.bandwidth.in']?.values ?? []).map(([, v]) => ({ value: parseFloat(v) / 1024 }))
      );
      setNetOutData(
        (netMetrics.time_series?.['network.0.bandwidth.out']?.values ?? []).map(([, v]) => ({ value: parseFloat(v) / 1024 }))
      );
    } catch {}
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Server Metrics</Text>
      </View>

      {/* Time Range Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangeBar}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
              Last {r}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <MetricChart title="CPU Usage" unit="%" data={cpuData} color={Colors.chartCpu} />
          <MetricChart title="Disk I/O Read" unit="KB/s" data={diskReadData} color={Colors.chartDisk} />
          <MetricChart title="Disk I/O Write" unit="KB/s" data={diskWriteData} color={Colors.warning} />
          <MetricChart title="Network In" unit="KB/s" data={netInData} color={Colors.chartNetwork} />
          <MetricChart title="Network Out" unit="KB/s" data={netOutData} color={Colors.info} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MetricChart({ title, unit, data, color }: { title: string; unit: string; data: { value: number }[]; color: string }) {
  if (!data.length) return null;
  const latest = data[data.length - 1]?.value ?? 0;
  const display = latest < 10 ? latest.toFixed(2) : latest.toFixed(1);
  return (
    <View style={styles.chart}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartCurrent}>{display} <Text style={styles.chartUnit}>{unit}</Text></Text>
      </View>
      <LineChart
        data={data}
        width={CHART_WIDTH}
        height={100}
        color={color}
        thickness={1.5}
        hideDataPoints
        areaChart
        startFillColor={color}
        endFillColor="transparent"
        startOpacity={0.2}
        endOpacity={0}
        backgroundColor={Colors.card}
        xAxisColor="transparent"
        yAxisColor="transparent"
        yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
        noOfSections={3}
        rulesColor={Colors.cardBorder}
        rulesType="solid"
        curved
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backIcon: { color: Colors.primary, fontSize: 30, fontWeight: '300' },
  title: { ...Typography.h1 },
  rangeBar: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, flexGrow: 0 },
  rangeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.card,
  },
  rangeBtnActive: { backgroundColor: Colors.primary },
  rangeBtnText: { ...Typography.bodySmall, fontWeight: '500' },
  rangeBtnTextActive: { color: Colors.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  chart: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  chartTitle: { ...Typography.body, fontWeight: '600' },
  chartCurrent: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  chartUnit: { ...Typography.caption, color: Colors.textMuted },
});
