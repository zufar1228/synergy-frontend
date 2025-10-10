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
  mqttCredentials: MqttCredentials;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

// --- WAREHOUSE API FUNCTIONS ---

export const getWarehouses = async (token: string): Promise<Warehouse[]> => {
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal mengambil data gudang" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal membuat gudang" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal memperbarui gudang" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal menghapus gudang" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal mengambil data area" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal membuat area" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal memperbarui area" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal menghapus area" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal mengambil data perangkat" }));
    throw new Error(errorBody.message);
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
    const error = await res.json();
    throw new Error(error.message || "Gagal membuat perangkat");
  }
  return res.json();
};

export const updateDevice = async (
  id: string,
  data: { name: string; area_id: string; system_type: string },
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal memperbarui perangkat" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal menghapus perangkat" }));
    throw new Error(errorBody.message);
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
    // <-- PERUBAHAN: Penanganan error yang lebih detail
    const errorBody = await res
      .json()
      .catch(() => ({ message: "Gagal mengambil data area" }));
    throw new Error(errorBody.message);
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
  if (!res.ok) throw new Error("Gagal mengambil data pengguna");
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
    const error = await res.json();
    throw new Error(error.message || "Gagal mengundang pengguna");
  }
  return res.json();
};

export const deleteUser = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal menghapus pengguna");
};

// Definisikan tipe untuk Profile
export interface Profile {
  id: string;
  username: string;
}

// --- PROFILE API FUNCTIONS ---

export const getMyProfile = async (token: string): Promise<Profile> => {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal mengambil data profil");
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
  if (!res.ok) throw new Error("Gagal memperbarui profil");
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
  if (!res.ok) throw new Error("Gagal mengubah peran pengguna");
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
    // Ambil body error dari respons backend
    const errorBody = await res.json();
    // Lemparkan pesan error yang spesifik
    throw new Error(errorBody.message || "Gagal mengubah status pengguna");
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
  if (!res.ok) throw new Error("Gagal mengambil detail gudang");
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
  if (!res.ok) throw new Error("Gagal mengambil data navigasi");
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
  if (!res.ok) throw new Error("Gagal mengambil data ringkasan insiden");
  return res.json();
};
