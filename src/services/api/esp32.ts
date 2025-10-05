import { supabase } from './supabase';

export const esp32Api = {
  async sendCommand(command: 'on' | 'off'): Promise<boolean> {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('esp32_device_id, esp32_secret')
        .single();

      if (!settings?.esp32_device_id || !settings?.esp32_secret) {
        throw new Error('ESP32 device not configured');
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('esp32-control', {
        body: {
          device_id: settings.esp32_device_id,
          device_secret: settings.esp32_secret,
          command,
        },
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('ESP32 command failed:', error);
      return false;
    }
  },

  async pairDevice(deviceId: string, deviceSecret: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          esp32_device_id: deviceId,
          esp32_secret: deviceSecret,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Device pairing failed:', error);
      return false;
    }
  },
};