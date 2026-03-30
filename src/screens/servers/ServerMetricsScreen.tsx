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
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

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
  const colors = useColors();
  const styles = makeStyles(colors);

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
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <MetricChart title="CPU Usage" unit="%" data={cpuData} color={colors.chartCpu} colors={colors} />
          <MetricChart title="Disk I/O Read" unit="KB/s" data={diskReadData} color={colors.chartDisk} colors={colors} />
          <MetricChart title="Disk I/O Write" unit="KB/s" data={diskWriteData} color={colors.warning} colors={colors} />
          <MetricChart title="Network In" unit="KB/s" data={netInData} color={colors.chartNetwork} colors={colors} />
          <MetricChart title="Network Out" unit="KB/s" data={netOutData} color={colors.info} colors={colors} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MetricChart({ title, unit, data, color, colors }: { title: string; unit: string; data: { value: number }[]; color: string; colors: ThemeColors }) {
  const styles = makeStyles(colors);
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
        backgroundColor={colors.card}
        xAxisColor="transparent"
        yAxisColor="transparent"
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={3}
        rulesColor={colors.cardBorder}
        rulesType="solid"
        curved
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backIcon: { color: c.primary, fontSize: 30, fontWeight: '300' },
  title: { ...Typography.h1, color: c.textPrimary },
  rangeBar: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, flexGrow: 0 },
  rangeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    backgroundColor: c.card,
  },
  rangeBtnActive: { backgroundColor: c.primary },
  rangeBtnText: { ...Typography.bodySmall, color: c.textSecondary, fontWeight: '500' },
  rangeBtnTextActive: { color: c.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  chart: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  chartTitle: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  chartCurrent: { ...Typography.body, fontWeight: '700', color: c.textPrimary },
  chartUnit: { ...Typography.caption, color: c.textMuted },
});
