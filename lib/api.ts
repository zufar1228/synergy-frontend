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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

type ApiError = Error & { status?: number };

const buildApiError = async (
  res: Response,
  fallbackMessage: string
): Promise<ApiError> => {
  const errorBody = await res
    .json()
    .catch(() => ({ message: fallbackMessage }));
  const message =
    typeof errorBody?.message === "string" && errorBody.message.trim() !== ""
      ? errorBody.message
      : fallbackMessage;
  const apiError = new Error(message) as ApiError;
  apiError.status = res.status;
  return apiError;
};

// --- WAREHOUSE API FUNCTIONS ---

export const getWarehouses = async (token: string): Promise<Warehouse[]> => {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data gudang");
  }
  return res.json();
};

export const createWarehouse = async (
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> => {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal membuat gudang");
  }
  return res.json();
};

export const updateWarehouse = async (
  id: string,
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> => {
  const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal memperbarui gudang");
  }
  return res.json();
};

export const deleteWarehouse = async (
  id: string,
  token: string
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal menghapus gudang");
  }
};

// --- AREA API FUNCTIONS ---

export const getAreas = async (token: string): Promise<Area[]> => {
  const res = await fetch(`${API_BASE_URL}/areas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data area");
  }
  return res.json();
};

export const createArea = async (
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> => {
  const res = await fetch(`${API_BASE_URL}/areas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal membuat area");
  }
  return res.json();
};

export const updateArea = async (
  id: string,
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> => {
  const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal memperbarui area");
  }
  return res.json();
};

export const deleteArea = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal menghapus area");
  }
};

// --- DEVICE API FUNCTIONS ---

export const getDevices = async (token: string): Promise<Device[]> => {
  const res = await fetch(`${API_BASE_URL}/devices`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data perangkat");
  }
  return res.json();
};

export const createDevice = async (
  data: { name: string; area_id: string; system_type: string },
  token: string
): Promise<CreateDeviceResponse> => {
  const res = await fetch(`${API_BASE_URL}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal membuat perangkat");
  }
  return res.json();
};

export const updateDevice = async (
  id: string,
  data: { name: string; area_id: string; system_type?: string },
  token: string
): Promise<Device> => {
  const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal memperbarui perangkat");
  }
  return res.json();
};

export const deleteDevice = async (
  id: string,
  token: string
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/devices/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal menghapus perangkat");
  }
};

// --- OTHER FUNCTIONS ---

export const getAreasByWarehouse = async (
  warehouseId: string,
  token: string
): Promise<Area[]> => {
  const res = await fetch(`${API_BASE_URL}/areas?warehouse_id=${warehouseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data area");
  }
  return res.json();
};

// Definisikan tipe untuk User
export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  invited_at?: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
}

// --- USER API FUNCTIONS ---

export const getUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data pengguna");
  }
  return res.json();
};

export const inviteUser = async (
  data: { email: string; role: "admin" | "user" },
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengundang pengguna");
  }
  return res.json();
};

export const deleteUser = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal menghapus pengguna");
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
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data profil");
  }
  return res.json();
};

export const updateMyProfile = async (
  data: { username: string },
  token: string
): Promise<Profile> => {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal memperbarui profil");
  }
  return res.json();
};

export const updateUserRole = async (
  userId: string,
  role: "admin" | "user",
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengubah peran pengguna");
  }
  return res.json();
};

export const updateUserStatus = async (
  userId: string,
  status: "active" | "inactive",
  token: string
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  // === PERBAIKI BLOK INI ===
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengubah status pengguna");
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
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil detail gudang");
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
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data navigasi");
  }
  return res.json();
};

// Tipe BARU untuk data summary chart
export interface IncidentSummary {
  name: string;
  total: number;
}

// Fungsi BARU untuk mengambil data analitik
export const getAnalytics = async (
  accessToken: string,
  systemType: string,
  areaId: string,
  page: string = "1"
) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/analytics/${systemType}?area_id=${areaId}&page=${page}`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
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
    url.searchParams.set("area_id", areaId);
    url.searchParams.set("page", page);
    url.searchParams.set("from", dateParams.from);
    url.searchParams.set("to", dateParams.to);

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return null;
  }
};

export interface IncidentSummary {
  name: string;
  total: number;
}

export const getIncidentSummaryByType = async (
  token: string,
  filters: { area_id?: string; from?: string; to?: string }
): Promise<IncidentSummary[]> => {
  const query = new URLSearchParams();
  if (filters.area_id) query.append("area_id", filters.area_id);
  if (filters.from) query.append("from", filters.from);
  if (filters.to) query.append("to", filters.to);

  const res = await fetch(
    `${API_BASE_URL}/analytics/gangguan/summary-by-type?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data ringkasan insiden");
  }
  return res.json();
};

export interface Incident {
  id: string;
  area_id: string;
  device_id: string;
  incident_type: string;
  system_type: string;
  status: "unacknowledged" | "acknowledged" | "resolved" | "false_alarm";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipe BARU untuk payload update status
export interface UpdateIncidentStatusPayload {
  status: "unacknowledged" | "acknowledged" | "resolved" | "false_alarm";
  notes?: string;
}

// Fungsi BARU
export const updateIncidentStatus = async (
  incidentId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<Incident> => {
  const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw await buildApiError(res, "Gagal memperbarui status insiden");
  }
  return res.json();
};

// Tipe BARU untuk data chart tren
export interface IncidentTrendPoint {
  date: string;
  total: number;
}

// Fungsi BARU
export const getIncidentTrendByWarehouse = async (
  token: string,
  filters: { warehouse_id: string; from?: string; to?: string }
): Promise<IncidentTrendPoint[]> => {
  const query = new URLSearchParams();
  query.append("warehouse_id", filters.warehouse_id);
  if (filters.from) query.append("from", filters.from);
  if (filters.to) query.append("to", filters.to);

  const res = await fetch(
    `${API_BASE_URL}/analytics/gangguan/trend-by-warehouse?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data tren insiden");
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
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw await buildApiError(res, "Gagal mengambil data peringatan aktif");
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
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal mengambil data preferensi");
  return res.json();
};

// Fungsi BARU
export const updateMyPreferences = async (
  data: NotificationPreference[],
  token: string
): Promise<NotificationPreference[]> => {
  const res = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal memperbarui preferensi");
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
  status: "unacknowledged" | "acknowledged" | "resolved" | "false_alarm";
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
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal memperbarui status log keamanan");
  return res.json();
};

// Tipe BARU untuk status perangkat lingkungan
export interface EnvironmentDeviceStatus {
  id: string;
  name: string;
  status: "Online" | "Offline";
  fan_status: "On" | "Off";
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
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Gagal mengambil status perangkat");
  return res.json();
};

// Fungsi BARU untuk mengirim perintah manual
export const sendManualFanCommand = async (
  token: string,
  deviceId: string,
  action: "On" | "Off"
): Promise<any> => {
  const res = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Gagal mengirim perintah");
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
  status: "active" | "left" | "kicked";
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
    cache: "no-store", // Selalu ambil data terbaru
  });
  if (!res.ok) throw new Error("Gagal mengambil daftar member Telegram");
  const json: TelegramMembersResponse = await res.json();
  return json.data;
};

// 2. Generate Link Undangan
export const generateTelegramInvite = async (
  token: string
): Promise<TelegramInviteResponse> => {
  const res = await fetch(`${API_BASE_URL}/telegram/invite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Gagal membuat link undangan");
  return res.json();
};

// 3. Kick Member
export const kickTelegramMember = async (
  token: string,
  telegramUserId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/telegram/kick`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: telegramUserId }),
  });
  if (!res.ok) throw new Error("Gagal mengeluarkan member");
  return res.json();
};

// 4. Kirim Test Alert
export const sendTelegramTestAlert = async (
  token: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${API_BASE_URL}/telegram/test-alert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Gagal mengirim test alert");
  return res.json();
};
