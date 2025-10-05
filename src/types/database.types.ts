export interface UserSettings {
  id: string;
  user_id: string;
  brightness: number;
  warning_time: number;
  shutoff_time: number;
  notifications_enabled: boolean;
  esp32_device_id?: string;
  esp32_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface WaterEvent {
  id: string;
  user_id: string;
  started_at: string;
  stopped_at?: string;
  duration_seconds?: number;
  status: 'running' | 'stopped' | 'auto_stopped';
  warning_sent: boolean;
  auto_shutoff: boolean;
  created_at: string;
}

export interface ESP32Device {
  id: string;
  user_id: string;
  device_id: string;
  device_secret: string;
  last_seen?: string;
  is_active: boolean;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  water_event_id: string;
  water_events?: WaterEvent;
  started_at: string;
  last_heartbeat: string;
}