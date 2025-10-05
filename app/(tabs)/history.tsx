import { AlertTriangle, Clock, Droplets, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWaterMonitor } from '../../src/hooks/useWaterMonitor';

export default function HistoryScreen() {
  const { history, loading } = useWaterMonitor();
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const totalUsage = history.reduce((sum, event) => sum + (event.duration_seconds || 0), 0);
  const avgDuration = history.length > 0 ? Math.floor(totalUsage / history.length) : 0;
  const autoStoppedCount = history.filter(e => e.auto_shutoff).length;

  const renderEventItem = ({ item }: any) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventDate}>{formatDateTime(item.started_at)}</Text>
          <Text style={styles.eventDuration}>
            Duration: {formatDuration(item.duration_seconds || 0)}
          </Text>
        </View>
        
        <View style={styles.eventBadges}>
          {item.auto_shutoff && (
            <View style={[styles.badge, styles.badgeDanger]}>
              <XCircle size={12} color="#DC2626" />
              <Text style={styles.badgeDangerText}>Auto Stopped</Text>
            </View>
          )}
          {item.warning_sent && !item.auto_shutoff && (
            <View style={[styles.badge, styles.badgeWarning]}>
              <AlertTriangle size={12} color="#D97706" />
              <Text style={styles.badgeWarningText}>Warning</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Water usage events</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Droplets size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGreen]}>
          <Clock size={24} color="#10B981" />
          <Text style={styles.statValue}>{formatDuration(avgDuration)}</Text>
          <Text style={styles.statLabel}>Avg Duration</Text>
        </View>

        {autoStoppedCount > 0 && (
          <View style={[styles.statCard, styles.statCardRed]}>
            <XCircle size={24} color="#EF4444" />
            <Text style={styles.statValue}>{autoStoppedCount}</Text>
            <Text style={styles.statLabel}>Auto Stopped</Text>
          </View>
        )}
      </View>

      {/* Events List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Recent Events</Text>
        
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Droplets size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No water events yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start monitoring your water usage
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statCardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventBadges: {
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeWarningText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeDangerText: {
    color: '#7F1D1D',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});