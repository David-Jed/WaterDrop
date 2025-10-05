import type { UserSettings } from '../../types/database.types';
import { supabase } from './supabase';

export const settingsApi = {
  async getSettings(): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createSettings(): Promise<UserSettings> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.user.id,
        brightness: 100,
        warning_time: 300,
        shutoff_time: 600,
        notifications_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};