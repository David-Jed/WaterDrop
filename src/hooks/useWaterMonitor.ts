import { useCallback, useEffect, useState } from 'react';
import { esp32Api } from '../services/api/esp32';
import { settingsApi } from '../services/api/settings';
import { waterEventsApi } from '../services/api/waterEvents';
import { notificationService } from '../services/notifications/pushNotifications';
import type { UserSettings, WaterEvent } from '../types/database.types';

export function useWaterMonitor() {
  const [activeSession, setActiveSession] = useState<WaterEvent | null>(null);
  const [history, setHistory] = useState<WaterEvent[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDuration, setCurrentDuration] = useState(0);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load settings or create if not exists
      let userSettings = await settingsApi.getSettings();
      if (!userSettings) {
        userSettings = await settingsApi.createSettings();
      }
      setSettings(userSettings);

      // Load active session
      const session = await waterEventsApi.getActiveSession();
      if (session?.water_events) {
        setActiveSession(session.water_events);
        const duration = Math.floor(
          (Date.now() - new Date(session.water_events.started_at).getTime()) / 1000
        );
        setCurrentDuration(duration);
      } else {
        setActiveSession(null);
        setCurrentDuration(0);
      }

      // Load history
      const events = await waterEventsApi.getEvents();
      setHistory(events);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup realtime subscription
  useEffect(() => {
    const subscription = waterEventsApi.subscribeToActiveSession((payload) => {
      console.log('Realtime update:', payload);
      loadData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Timer for active session
  useEffect(() => {
    if (!activeSession || !settings) return;

    const interval = setInterval(() => {
      const duration = Math.floor(
        (Date.now() - new Date(activeSession.started_at).getTime()) / 1000
      );
      setCurrentDuration(duration);

      // Check for warning threshold
      if (duration === settings.warning_time && !activeSession.warning_sent) {
        handleWarning(activeSession.id);
      }

      // Check for auto shutoff
      if (duration >= settings.shutoff_time && !activeSession.auto_shutoff) {
        handleAutoShutoff(activeSession.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, settings]);

  const startWaterFlow = async () => {
    try {
      const event = await waterEventsApi.startFlow();
      setActiveSession(event);
      setCurrentDuration(0);

      // Send command to ESP32
      await esp32Api.sendCommand('on');
    } catch (error) {
      console.error('Failed to start water flow:', error);
      throw error;
    }
  };

  const stopWaterFlow = async () => {
    if (!activeSession) return;

    try {
      await waterEventsApi.stopFlow(activeSession.id, false);

      // Send command to ESP32
      await esp32Api.sendCommand('off');

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Failed to stop water flow:', error);
      throw error;
    }
  };

  const handleWarning = async (eventId: string) => {
    if (!settings?.notifications_enabled) return;

    try {
      await notificationService.scheduleWarningNotification(currentDuration);

      // Update event to mark warning sent
      const { supabase } = await import('../services/api/supabase');
      await supabase
        .from('water_events')
        .update({ warning_sent: true })
        .eq('id', eventId);

      // Update local state
      if (activeSession) {
        setActiveSession({ ...activeSession, warning_sent: true });
      }
    } catch (error) {
      console.error('Failed to send warning:', error);
    }
  };

  const handleAutoShutoff = async (eventId: string) => {
    try {
      await waterEventsApi.stopFlow(eventId, true);
      await esp32Api.sendCommand('off');

      if (settings?.notifications_enabled) {
        await notificationService.scheduleShutoffNotification();
      }

      await loadData();
    } catch (error) {
      console.error('Failed to auto shutoff:', error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      const updated = await settingsApi.updateSettings(updates);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  return {
    activeSession,
    history,
    settings,
    loading,
    currentDuration,
    startWaterFlow,
    stopWaterFlow,
    updateSettings,
    refreshData,
  };
}