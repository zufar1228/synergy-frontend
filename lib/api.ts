// frontend/lib/api.ts

// Definisikan tipe dasar untuk Warehouse agar bisa digunakan kembali
export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Definisikan tipe untuk Area
export interface Area {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse?: {
    id: string;
    name: string;
  };
}

// Definisikan tipe untuk Device
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

// Tipe BARU untuk kredensial MQTT
export interface MqttCredentials {
  username: string;
  password: string;
}

// Tipe BARU untuk respons pembuatan perangkat
export interface CreateDeviceResponse {
  device: Device;
  mqttCredentials: MqttCredentials | null; // <-- Jadikan nullable
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

type ApiError = Error & { status?: number };

const buildApiError = async (
  res: Response,
  fallbackMessage: string
): Promise<ApiError> => {
  const errorBody = await res
    .json()
    .catch(() => ({ message: fallbackMessage }));
  const message =
    typeof errorBody?.message === 'string' && errorBody.message.trim() !== ''
      ? errorBody.message
      : fallbackMessage;
  const apiError = new Error(message) as ApiError;
  apiError.status = res.status;
  return apiError;
};

// --- USER ACCESS VERIFICATION ---

export interface VerifyAccessResponse {
  authorized: boolean;
  message: string;
}

/**
 * Verify if the current user is authorized to access the system.
 * Users must be invited through user management or manually added to Supabase.
 */
export const verifyUserAccess = async (
  token: string
): Promise<VerifyAccessResponse> => {
  const res = await fetch(`${API_BASE_URL}/users/verify-access`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// --- WAREHOUSE API FUNCTIONS ---

export const getWarehouses = async (token: string): Promise<Warehouse[]> => {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data gudang');
  }
  return res.json();
};

export const createWarehouse = async (
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> => {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal membuat gudang');
  }
  return res.json();
};

export const updateWarehouse = async (
  id: string,
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> => {
  const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal memperbarui gudang');
  }
  return res.json();
};

export const deleteWarehouse = async (
  id: string,
  token: string
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal menghapus gudang');
  }
};

// --- AREA API FUNCTIONS ---

export const getAreas = async (token: string): Promise<Area[]> => {
  const res = await fetch(`${API_BASE_URL}/areas`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data area');
  }
  return res.json();
};

export const createArea = async (
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> => {
  const res = await fetch(`${API_BASE_URL}/areas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal membuat area');
  }
  return res.json();
};

export const updateArea = async (
  id: string,
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> => {
  const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal memperbarui area');
  }
  return res.json();
};

export const deleteArea = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal menghapus area');
  }
};

// --- DEVICE API FUNCTIONS ---

export const getDevices = async (token: string): Promise<Device[]> => {
  const res = await fetch(`${API_BASE_URL}/devices`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data perangkat');
  }
  return res.json();
};

export const createDevice = async (
  data: { name: string; area_id: string; system_type: string },
  token: string
): Promise<CreateDeviceResponse> => {
  const res = await fetch(`${API_BASE_URL}/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal membuat perangkat');
  }
  return res.json();
};

export const updateDevice = async (
  id: string,
  data: { name: string; area_id: string; system_type?: string },
  token: string
): Promise<Device> => {
  const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal memperbarui perangkat');
  }
  return res.json();
};

export const deleteDevice = async (
  id: string,
  token: string
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal menghapus perangkat');
  }
};

// --- OTHER FUNCTIONS ---

export const getAreasByWarehouse = async (
  warehouseId: string,
  token: string
): Promise<Area[]> => {
  const res = await fetch(`${API_BASE_URL}/areas?warehouse_id=${warehouseId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data area');
  }
  return res.json();
};

// Definisikan tipe untuk User
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  invited_at?: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
}

// --- USER API FUNCTIONS ---

export const getUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data pengguna');
  }
  return res.json();
};

export const inviteUser = async (
  data: { email: string; role: 'admin' | 'user' },
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengundang pengguna');
  }
  return res.json();
};

export const deleteUser = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal menghapus pengguna');
  }
};

// Definisikan tipe untuk Profile
export interface Profile {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  full_name?: string;
}

// --- PROFILE API FUNCTIONS ---

export const getMyProfile = async (token: string): Promise<Profile> => {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data profil');
  }
  return res.json();
};

export const updateMyProfile = async (
  data: { username: string },
  token: string
): Promise<Profile> => {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal memperbarui profil');
  }
  return res.json();
};

export const updateUserRole = async (
  userId: string,
  role: 'admin' | 'user',
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengubah peran pengguna');
  }
  return res.json();
};

export const updateUserStatus = async (
  userId: string,
  status: 'active' | 'inactive',
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  // === PERBAIKI BLOK INI ===
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengubah status pengguna');
  }
  // ==========================

  return res.json();
};

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

export const getWarehouseDetails = async (
  id: string,
  token: string
): Promise<WarehouseDetails> => {
  const res = await fetch(
    `${API_BASE_URL}/warehouses/${id}/areas-with-systems`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil detail gudang');
  }
  return res.json();
};

export interface NavArea {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse_name: string;
}

// Fungsi BARU
export const getNavAreasBySystem = async (
  systemType: string,
  token: string
): Promise<NavArea[]> => {
  const res = await fetch(
    `${API_BASE_URL}/navigation/areas-by-system?system_type=${systemType}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data navigasi');
  }
  return res.json();
};

// Fungsi BARU untuk mengambil data analitik
export const getAnalytics = async (
  accessToken: string,
  systemType: string,
  areaId: string,
  page: string = '1'
) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/analytics/${systemType}?area_id=${areaId}&page=${page}`,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
};

// Fungsi BARU untuk mengambil data analitik dengan filter tanggal
export const getAnalyticsDataForSystem = async (
  systemType: string,
  areaId: string,
  page: string,
  accessToken: string,
  dateParams: { from: string; to: string }
) => {
  try {
    const url = new URL(`${API_BASE_URL}/analytics/${systemType}`);
    url.searchParams.set('area_id', areaId);
    url.searchParams.set('page', page);
    url.searchParams.set('from', dateParams.from);
    url.searchParams.set('to', dateParams.to);

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
};

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

// Tipe BARU untuk payload update status
export interface UpdateIncidentStatusPayload {
  status: 'unacknowledged' | 'acknowledged' | 'resolved' | 'false_alarm';
  notes?: string;
}

// Fungsi BARU
export const updateIncidentStatus = async (
  incidentId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<Incident> => {
  const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal memperbarui status insiden');
  }
  return res.json();
};

// Tipe BARU untuk data peringatan aktif
export interface ActiveAlert {
  area_id: string;
  system_type: string;
}

// Fungsi BARU
export const getActiveAlerts = async (
  warehouseId: string,
  token: string
): Promise<ActiveAlert[]> => {
  const res = await fetch(
    `${API_BASE_URL}/alerts/active?warehouse_id=${warehouseId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data peringatan aktif');
  }
  return res.json();
};

// Tipe BARU untuk preferensi
export interface NotificationPreference {
  system_type: string;
  is_enabled: boolean;
}

// Fungsi BARU
export const getMyPreferences = async (
  token: string
): Promise<NotificationPreference[]> => {
  const res = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Gagal mengambil data preferensi');
  return res.json();
};

// Fungsi BARU
export const updateMyPreferences = async (
  data: NotificationPreference[],
  token: string
): Promise<NotificationPreference[]> => {
  const res = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Gagal memperbarui preferensi');
  return res.json();
};

// Tipe BARU untuk log keamanan (sesuai model backend)
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

// Fungsi BARU untuk update status log keamanan
export const updateKeamananLogStatus = async (
  logId: string,
  data: UpdateIncidentStatusPayload, // Kita bisa gunakan tipe yang sama dari insiden
  token: string
): Promise<KeamananLog> => {
  const res = await fetch(`${API_BASE_URL}/security-logs/${logId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Gagal memperbarui status log keamanan');
  return res.json();
};

// Tipe BARU untuk status perangkat lingkungan
export interface EnvironmentDeviceStatus {
  id: string;
  name: string;
  status: 'Online' | 'Offline';
  fan_status: 'On' | 'Off';
  // Intrusi-specific fields (nullable, only present for intrusi devices)
  door_state?: 'OPEN' | 'CLOSED' | null;
  intrusi_system_state?: 'ARMED' | 'DISARMED' | null;
  siren_state?: 'ON' | 'COOLDOWN' | 'OFF' | null;
  power_source?: 'MAINS' | 'BATTERY' | null;
  vbat_voltage?: number | null;
  vbat_pct?: number | null;
}

// Fungsi BARU untuk mengambil status kipas
export const getDeviceDetailsByArea = async (
  token: string,
  areaId: string,
  systemType: string
): Promise<EnvironmentDeviceStatus> => {
  const res = await fetch(
    `${API_BASE_URL}/devices/details?area_id=${areaId}&system_type=${systemType}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }
  );
  if (!res.ok) throw new Error('Gagal mengambil status perangkat');
  return res.json();
};

// Fungsi BARU untuk mengirim perintah manual
export const sendManualFanCommand = async (
  token: string,
  deviceId: string,
  action: 'On' | 'Off'
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Gagal mengirim perintah');
  return res.json();
};

// ============================================================================
// TELEGRAM API FUNCTIONS
// ============================================================================

// --- Tipe Data Telegram ---
export interface TelegramSubscriber {
  user_id: string; // BigInt dikirim sebagai string dari backend untuk keamanan
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

// 1. Ambil daftar member grup
export const getTelegramMembers = async (
  token: string,
  includeInactive = false
): Promise<TelegramSubscriber[]> => {
  const url = includeInactive
    ? `${API_BASE_URL}/telegram/members?include_inactive=true`
    : `${API_BASE_URL}/telegram/members`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' // Selalu ambil data terbaru
  });
  if (!res.ok) throw new Error('Gagal mengambil daftar member Telegram');
  const json: TelegramMembersResponse = await res.json();
  return json.data;
};

// 2. Generate Link Undangan
export const generateTelegramInvite = async (
  token: string
): Promise<TelegramInviteResponse> => {
  const res = await fetch(`${API_BASE_URL}/telegram/invite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Gagal membuat link undangan');
  return res.json();
};

// 3. Kick Member
export const kickTelegramMember = async (
  token: string,
  telegramUserId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/telegram/kick`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: telegramUserId })
  });
  if (!res.ok) throw new Error('Gagal mengeluarkan member');
  return res.json();
};

// 4. Kirim Test Alert
export const sendTelegramTestAlert = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/telegram/test-alert`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Gagal mengirim test alert');
  return res.json();
};

// === INTRUSI (Door Security System) API ===

export type IntrusiEventType =
  | 'IMPACT_WARNING'
  | 'FORCED_ENTRY_ALARM'
  | 'UNAUTHORIZED_OPEN'
  | 'POWER_SOURCE_CHANGED'
  | 'CALIB_SAVED'
  | 'CALIB_ABORTED'
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

/** Get intrusion logs for a device with pagination and filters */
export const getIntrusiLogs = async (
  token: string,
  deviceId: string,
  options?: {
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
    event_type?: IntrusiEventType;
  }
): Promise<{
  data: IntrusiLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> => {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.event_type) params.set('event_type', options.event_type);

  const res = await fetch(
    `${API_BASE_URL}/intrusi/devices/${deviceId}/logs?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil data intrusi');
  }
  return res.json();
};

/** Get intrusion summary for a device */
export const getIntrusiSummary = async (
  token: string,
  deviceId: string,
  from?: string,
  to?: string
): Promise<IntrusiSummary> => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const res = await fetch(
    `${API_BASE_URL}/intrusi/devices/${deviceId}/summary?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil ringkasan intrusi');
  }

  const json = await res.json();
  return json.data;
};

/** Get current door security status for a device */
export const getIntrusiStatus = async (
  token: string,
  deviceId: string
): Promise<IntrusiStatus> => {
  const res = await fetch(
    `${API_BASE_URL}/intrusi/devices/${deviceId}/status`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengambil status intrusi');
  }

  const json = await res.json();
  return json.data;
};

/** Update acknowledgement status for an intrusion log */
export const updateIntrusiLogStatus = async (
  logId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<IntrusiLog> => {
  const res = await fetch(`${API_BASE_URL}/intrusi/logs/${logId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Gagal memperbarui status log intrusi');
  return res.json();
};

// === Intrusi Device Commands (Spec v18) ===

export type IntrusiCommandType =
  | 'ARM'
  | 'DISARM'
  | 'CALIB_KNOCK_START'
  | 'SIREN_SILENCE'
  | 'STATUS';

export interface IntrusiCommandPayload {
  cmd: IntrusiCommandType;
  n_hits?: number;
  timeout_ms?: number;
  issued_by?: string;
}

/** Send a command to an intrusi (door security) device */
export const sendIntrusiCommand = async (
  token: string,
  deviceId: string,
  command: IntrusiCommandPayload
): Promise<{ message: string; device_id: string; command: string }> => {
  const res = await fetch(
    `${API_BASE_URL}/intrusi/devices/${deviceId}/command`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(command)
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengirim perintah ke perangkat');
  }
  return res.json();
};

// ──────────────────────────────────────────────
// Push Notification API
// ──────────────────────────────────────────────

/** Get the VAPID public key from the backend */
export const getVapidPublicKey = async (
  token: string
): Promise<{ publicKey: string }> => {
  const res = await fetch(`${API_BASE_URL}/users/push/vapid-key`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mendapatkan VAPID key');
  }
  return res.json();
};

/** Subscribe to push notifications */
export const subscribeToPush = async (
  token: string,
  subscription: PushSubscriptionJSON
): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/users/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ subscription })
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mendaftarkan push notification');
  }
  return res.json();
};

/** Send a test push notification */
export const testPushNotification = async (
  token: string
): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/users/push/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw await buildApiError(res, 'Gagal mengirim test push notification');
  }
  return res.json();
};
