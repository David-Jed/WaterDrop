import Slider from '@react-native-community/slider';
import {
    Bell,
    BellOff,
    Camera,
    ChevronRight,
    Clock,
    LogOut,
    Sun,
    Wifi,
    WifiOff,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWaterMonitor } from '../../src/hooks/useWaterMonitor';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, loading } = useWaterMonitor();

  const [localBrightness, setLocalBrightness] = useState(settings?.brightness || 100);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleBrightnessChange = (value: number) => {
    setLocalBrightness(value);
  };

  const handleBrightnessComplete = (value: number) => {
    updateSettings({ brightness: Math.round(value) });
  };

  const handleWarningTimeChange = (value: number) => {
    updateSettings({ warning_time: Math.round(value) });
  };

  const handleShutoffTimeChange = (value: number) => {
    updateSettings({ shutoff_time: Math.round(value) });
  };

  const handleNotificationsToggle = (value: boolean) => {
    updateSettings({ notifications_enabled: value });
  };

  const handlePairDevice = () => {
    Alert.alert(
      'Pair WaterDrop smart Device',
      'Scan the QR code on your WaterDrop smart device to pair it with your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Scan QR Code', onPress: () => console.log('Opens QR scanner, Not implemented yet...') },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!settings) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sun size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Display</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Brightness</Text>
              <Text style={styles.settingValue}>{Math.round(localBrightness)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={localBrightness}
              onValueChange={handleBrightnessChange}
              onSlidingComplete={handleBrightnessComplete}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#3B82F6"
            />
          </View>
        </View>

        {/* Timing Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Timing</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Warning Time</Text>
              <Text style={styles.settingValue}>
                {formatDuration(settings.warning_time)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={1800}
              step={60}
              value={settings.warning_time}
              onSlidingComplete={handleWarningTimeChange}
              minimumTrackTintColor="#F59E0B"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#F59E0B"
            />
            <Text style={styles.settingHint}>
              Sends a notification after water runs for this duration
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto Shutoff Time</Text>
              <Text style={styles.settingValue}>
                {formatDuration(settings.shutoff_time)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={120}
              maximumValue={3600}
              step={60}
              value={settings.shutoff_time}
              onSlidingComplete={handleShutoffTimeChange}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#EF4444"
            />
            <Text style={styles.settingHint}>
              Automatically shuts off water after this duration
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {settings.notifications_enabled ? (
              <Bell size={20} color="#1F2937" />
            ) : (
              <BellOff size={20} color="#1F2937" />
            )}
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Notifications</Text>
                <Text style={styles.settingHint}>
                  Receive alerts for warnings and auto shutoff
                </Text>
              </View>
              <Switch
                value={settings.notifications_enabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={settings.notifications_enabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* ESP32 Device */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {settings.esp32_device_id ? (
              <Wifi size={20} color="#1F2937" />
            ) : (
              <WifiOff size={20} color="#1F2937" />
            )}
            <Text style={styles.sectionTitle}>WaterDrop Smart Connection</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Device Status</Text>
                <Text style={styles.settingHint}>
                  {settings.esp32_device_id ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  settings.esp32_device_id ? styles.statusConnected : styles.statusDisconnected,
                ]}
              >
                <View style={styles.statusDot} />
              </View>
            </View>

            {settings.esp32_device_id && (
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceIdLabel}>Device ID</Text>
                <Text style={styles.deviceId}>{settings.esp32_device_id}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.pairButton} onPress={handlePairDevice}>
              <Camera size={20} color="#3B82F6" />
              <Text style={styles.pairButtonText}>
                {settings.esp32_device_id ? 'Pair New Device' : 'Pair Device'}
              </Text>
              <ChevronRight size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Water Monitor v1.0.0</Text>
          <Text style={styles.appInfoText}>Smart Water Management System</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settingHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusConnected: {
    backgroundColor: '#D1FAE5',
  },
  statusDisconnected: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  deviceInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  deviceIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  pairButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});