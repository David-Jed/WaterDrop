import { AlertTriangle, Clock, Droplets, Power } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWaterMonitor } from '../../src/hooks/useWaterMonitor';

export default function DashboardScreen() {
  const {
    activeSession,
    settings,
    currentDuration,
    startWaterFlow,
    stopWaterFlow,
    loading,
  } = useWaterMonitor();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const showWarning = activeSession && settings && currentDuration >= settings.warning_time && currentDuration < settings.shutoff_time;

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WaterDrop</Text>
          <Text style={styles.headerSubtitle}>Watch your water realtime, anytime.</Text>
        </View>

        {/* Main Status Card */}
        <View style={styles.card}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIcon,
                activeSession ? styles.statusIconActive : styles.statusIconInactive,
              ]}
            >
              <Droplets
                size={48}
                color={activeSession ? '#3B82F6' : '#9CA3AF'}
                strokeWidth={2}
              />
            </View>

            <Text style={styles.statusTitle}>
              {activeSession ? 'Water Running' : 'Water Off'}
            </Text>

            {activeSession && (
              <>
                <Text style={styles.duration}>{formatDuration(currentDuration)}</Text>
                <Text style={styles.startedAt}>
                  Started at {formatDateTime(new Date(activeSession.started_at))}
                </Text>

                {showWarning && (
                  <View style={styles.warningBanner}>
                    <AlertTriangle size={20} color="#D97706" />
                    <Text style={styles.warningText}>
                      Water has been running for {formatDuration(currentDuration)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.controlButton,
                activeSession ? styles.stopButton : styles.startButton,
              ]}
              onPress={activeSession ? stopWaterFlow : startWaterFlow}
              disabled={loading}
            >
              <Power size={20} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>
                {activeSession ? 'Stop Water' : 'Start Water Flow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thresholds Card */}
        {settings && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={20} color="#1F2937" />
              <Text style={styles.cardTitle}>Thresholds</Text>
            </View>

            <View style={styles.thresholdsGrid}>
              <View style={[styles.thresholdCard, styles.warningThreshold]}>
                <Text style={styles.thresholdLabel}>Warning Time</Text>
                <Text style={styles.thresholdValue}>
                  {formatDuration(settings.warning_time)}
                </Text>
              </View>

              <View style={[styles.thresholdCard, styles.shutoffThreshold]}>
                <Text style={styles.thresholdLabel}>Auto Shutoff</Text>
                <Text style={styles.thresholdValue}>
                  {formatDuration(settings.shutoff_time)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0m</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconActive: {
    backgroundColor: '#EFF6FF',
  },
  statusIconInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  duration: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  startedAt: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  thresholdsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  thresholdCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  warningThreshold: {
    backgroundColor: '#FEF3C7',
  },
  shutoffThreshold: {
    backgroundColor: '#FEE2E2',
  },
  thresholdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  thresholdValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});