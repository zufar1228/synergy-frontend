// frontend/lib/api/types.ts

// --- Core Domain Types ---

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Area {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface Device {
  id: string;
  name: string;
  system_type: string;
  area_id: string;
  area?: {
    id: string;
    name: string;
    warehouse: {
      id: string;
      name: string;
    };
  };
}

export interface MqttCredentials {
  username: string;
  password: string;
}

export interface CreateDeviceResponse {
  device: Device;
  mqttCredentials: MqttCredentials | null;
}

// --- User Types ---

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  invited_at?: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  full_name?: string;
}

export interface VerifyAccessResponse {
  authorized: boolean;
  message: string;
}

// --- Warehouse Details ---

export interface WarehouseDetails {
  id: string;
  name: string;
  location: string | null;
  areas: {
    id: string;
    name: string;
    active_systems: {
      system_type: string;
      device_count: number;
    }[];
  }[];
}

// --- Navigation ---

export interface NavArea {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse_name: string;
}

// --- Analytics ---

export interface AnalyticsParams {
  systemType: string;
  areaId: string;
  page?: string;
  perPage?: string;
  from?: string;
  to?: string;
}

// --- Incidents & Alerts ---

export interface Incident {
  id: string;
  area_id: string;
  device_id: string;
  incident_type: string;
  system_type: string;
  status: 'unacknowledged' | 'acknowledged' | 'resolved' | 'false_alarm';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateIncidentStatusPayload {
  status: 'unacknowledged' | 'acknowledged' | 'resolved' | 'false_alarm';
  notes?: string;
}

export interface ActiveAlert {
  area_id: string;
  system_type: string;
}

// --- Notification Preferences ---

export interface NotificationPreference {
  system_type: string;
  is_enabled: boolean;
}

// --- Keamanan ---

export interface KeamananLog {
  id: string;
  device_id: string;
  created_at: string;
  image_url: string;
  detected: boolean;
  box: object | null;
  confidence: number | null;
  attributes: object | null;
  status: 'unacknowledged' | 'acknowledged' | 'resolved' | 'false_alarm';
  notes: string | null;
  device: { name: string };
}

// --- Device Status ---

export interface EnvironmentDeviceStatus {
  id: string;
  name: string;
  status: 'Online' | 'Offline';
  fan_state: 'ON' | 'OFF';
  door_state?: 'OPEN' | 'CLOSED' | null;
  intrusi_system_state?: 'ARMED' | 'DISARMED' | null;
  siren_state?: 'ON' | 'COOLDOWN' | 'OFF' | null;
  power_source?: 'MAINS' | 'BATTERY' | null;
  vbat_voltage?: number | null;
  vbat_pct?: number | null;
}

// --- Telegram ---

export interface TelegramSubscriber {
  user_id: string;
  username: string | null;
  first_name: string | null;
  status: 'active' | 'left' | 'kicked';
  joined_at: string;
  left_at: string | null;
  kicked_at: string | null;
}

export interface TelegramInviteResponse {
  success: boolean;
  invite_link: string;
  expires_at: string;
  member_limit: number;
}

export interface TelegramMembersResponse {
  success: boolean;
  count: number;
  data: TelegramSubscriber[];
}

// --- Intrusi ---

export type IntrusiEventType =
  | 'IMPACT_WARNING'
  | 'FORCED_ENTRY_ALARM'
  | 'UNAUTHORIZED_OPEN'
  | 'POWER_SOURCE_CHANGED'
  | 'BATTERY_LEVEL_CHANGED'
  | 'SIREN_SILENCED'
  | 'ARM'
  | 'DISARM';

export type DoorState = 'OPEN' | 'CLOSED';
export type SystemState = 'ARMED' | 'DISARMED';
export type AcknowledgeStatus =
  | 'unacknowledged'
  | 'acknowledged'
  | 'resolved'
  | 'false_alarm';

export interface IntrusiLog {
  id: string;
  device_id: string;
  timestamp: string;
  event_type: IntrusiEventType;
  system_state: SystemState;
  door_state: DoorState;
  peak_delta_g: number | null;
  hit_count: number | null;
  payload: Record<string, any> | null;
  status: AcknowledgeStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  notification_sent_at: string | null;
  device?: { id: string; name: string };
}

export interface IntrusiSummary {
  total_events: number;
  alarm_events: number;
  impact_warnings: number;
  unacknowledged: number;
  latest_event: IntrusiLog | null;
}

export interface IntrusiStatus {
  status: 'AMAN' | 'WASPADA' | 'BAHAYA';
  system_state: SystemState;
  door_state: DoorState;
  latest_event: IntrusiLog | null;
  latest_alarm: IntrusiLog | null;
}

export type IntrusiCommandType = 'ARM' | 'DISARM' | 'SIREN_SILENCE' | 'STATUS';

export interface IntrusiCommandPayload {
  cmd: IntrusiCommandType;
  issued_by?: string;
}

// --- Lingkungan ---

export interface LingkunganLog {
  id: string;
  device_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  status: 'unacknowledged' | 'acknowledged' | 'resolved' | 'false_alarm';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  notification_sent_at: string | null;
}

export interface LingkunganStatus {
  status: 'NORMAL' | 'WASPADA' | 'BAHAYA';
  fan_state: string;
  dehumidifier_state: string;
  control_mode: string;
  manual_override_until: string | null;
  latest_reading: {
    temperature: number;
    humidity: number;
    co2: number;
    timestamp: string;
  } | null;
  latest_prediction: {
    predicted_temperature: number;
    predicted_humidity: number;
    predicted_co2: number;
    timestamp: string;
  } | null;
}
