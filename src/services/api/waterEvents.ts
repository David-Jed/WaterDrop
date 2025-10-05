import type { WaterEvent } from '../../types/database.types';
import { supabase } from './supabase';

export const waterEventsApi = {
  // Get all events for current user
  async getEvents(): Promise<WaterEvent[]> {
    const { data, error } = await supabase
      .from('water_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  // Get active session
  async getActiveSession() {
    const { data: session } = await supabase
      .from('active_sessions')
      .select('*, water_events(*)')
      .single();

    return session;
  },

  // Start water flow
  async startFlow(): Promise<WaterEvent> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Create water event
    const { data: event, error: eventError } = await supabase
      .from('water_events')
      .insert({
        user_id: user.user.id,
        started_at: new Date().toISOString(),
        status: 'running',
        warning_sent: false,
        auto_shutoff: false,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Create active session
    const { error: sessionError } = await supabase
      .from('active_sessions')
      .insert({
        user_id: user.user.id,
        water_event_id: event.id,
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
      });

    if (sessionError) throw sessionError;

    return event;
  },

  // Stop water flow
  async stopFlow(eventId: string, autoShutoff: boolean = false) {
    const stoppedAt = new Date().toISOString();
    
    const { data: event } = await supabase
      .from('water_events')
      .select('started_at')
      .eq('id', eventId)
      .single();

    const durationSeconds = event
      ? Math.floor((new Date(stoppedAt).getTime() - new Date(event.started_at).getTime()) / 1000)
      : 0;

    // Update water event
    const { error: eventError } = await supabase
      .from('water_events')
      .update({
        stopped_at: stoppedAt,
        duration_seconds: durationSeconds,
        status: autoShutoff ? 'auto_stopped' : 'stopped',
        auto_shutoff: autoShutoff,
      })
      .eq('id', eventId);

    if (eventError) throw eventError;

    // Delete active session
    const { error: sessionError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('water_event_id', eventId);

    if (sessionError) throw sessionError;
  },

  // Subscribe to active session changes
  subscribeToActiveSession(callback: (payload: any) => void) {
    return supabase
      .channel('active_session_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
        },
        callback
      )
      .subscribe();
  },
};