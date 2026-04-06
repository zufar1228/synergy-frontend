// frontend/lib/demo/mock-data.ts
// All mock data used in demo mode. Realistic IoT warehouse monitoring data.

// --- IDs ---
const WH1 = 'demo-wh-001';
const WH2 = 'demo-wh-002';
const AREA1_WH1 = 'demo-area-001';
const AREA2_WH1 = 'demo-area-002';
const AREA1_WH2 = 'demo-area-003';
const DEV_LINGKUNGAN_1 = 'demo-dev-ling-001';
const DEV_INTRUSI_1 = 'demo-dev-intr-001';
const DEV_KEAMANAN_1 = 'demo-dev-keam-001';
const DEV_LINGKUNGAN_2 = 'demo-dev-ling-002';

// --- Timestamps ---
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

// --- Warehouses ---
export const DEMO_WAREHOUSES = [
  {
    id: WH1,
    name: 'Gudang Utama',
    location: 'Jakarta Utara',
    areaCount: '2',
    deviceCount: '3',
    onlineDeviceCount: '3',
  },
  {
    id: WH2,
    name: 'Gudang Cabang',
    location: 'Tangerang',
    areaCount: '1',
    deviceCount: '1',
    onlineDeviceCount: '1',
  },
];

// --- Areas ---
export const DEMO_AREAS = [
  { id: AREA1_WH1, name: 'Zona A', warehouse_id: WH1, warehouse: { id: WH1, name: 'Gudang Utama' } },
  { id: AREA2_WH1, name: 'Zona B', warehouse_id: WH1, warehouse: { id: WH1, name: 'Gudang Utama' } },
  { id: AREA1_WH2, name: 'Zona Utama', warehouse_id: WH2, warehouse: { id: WH2, name: 'Gudang Cabang' } },
];

// --- Nav Areas ---
export const DEMO_NAV_AREAS = {
  keamanan: [
    { id: AREA1_WH1, name: 'Zona A', warehouse_id: WH1, warehouse_name: 'Gudang Utama' },
  ],
  intrusi: [
    { id: AREA2_WH1, name: 'Zona B', warehouse_id: WH1, warehouse_name: 'Gudang Utama' },
  ],
  lingkungan: [
    { id: AREA1_WH1, name: 'Zona A', warehouse_id: WH1, warehouse_name: 'Gudang Utama' },
    { id: AREA1_WH2, name: 'Zona Utama', warehouse_id: WH2, warehouse_name: 'Gudang Cabang' },
  ],
};

// --- Devices ---
export const DEMO_DEVICES = [
  {
    id: DEV_LINGKUNGAN_1,
    name: 'Sensor Lingkungan A1',
    system_type: 'lingkungan',
    area_id: AREA1_WH1,
    area: { id: AREA1_WH1, name: 'Zona A', warehouse: { id: WH1, name: 'Gudang Utama' } },
  },
  {
    id: DEV_INTRUSI_1,
    name: 'Sensor Pintu B1',
    system_type: 'intrusi',
    area_id: AREA2_WH1,
    area: { id: AREA2_WH1, name: 'Zona B', warehouse: { id: WH1, name: 'Gudang Utama' } },
  },
  {
    id: DEV_KEAMANAN_1,
    name: 'Kamera CCTV A1',
    system_type: 'keamanan',
    area_id: AREA1_WH1,
    area: { id: AREA1_WH1, name: 'Zona A', warehouse: { id: WH1, name: 'Gudang Utama' } },
  },
  {
    id: DEV_LINGKUNGAN_2,
    name: 'Sensor Lingkungan C1',
    system_type: 'lingkungan',
    area_id: AREA1_WH2,
    area: { id: AREA1_WH2, name: 'Zona Utama', warehouse: { id: WH2, name: 'Gudang Cabang' } },
  },
];

// --- Warehouse Details ---
export const DEMO_WAREHOUSE_DETAILS: Record<string, any> = {
  [WH1]: {
    id: WH1,
    name: 'Gudang Utama',
    location: 'Jakarta Utara',
    areas: [
      {
        id: AREA1_WH1,
        name: 'Zona A',
        active_systems: [
          { system_type: 'lingkungan', device_count: 1, status: 'Online' },
          { system_type: 'keamanan', device_count: 1, status: 'Online' },
        ],
      },
      {
        id: AREA2_WH1,
        name: 'Zona B',
        active_systems: [
          { system_type: 'intrusi', device_count: 1, status: 'Online' },
        ],
      },
    ],
  },
  [WH2]: {
    id: WH2,
    name: 'Gudang Cabang',
    location: 'Tangerang',
    areas: [
      {
        id: AREA1_WH2,
        name: 'Zona Utama',
        active_systems: [
          { system_type: 'lingkungan', device_count: 1, status: 'Online' },
        ],
      },
    ],
  },
};

// --- Active Alerts ---
export const DEMO_ACTIVE_ALERTS: any[] = [];

// --- User Profile ---
export const DEMO_PROFILE = {
  id: 'demo-user-001',
  username: 'Demo User',
  email: 'demo@synergy-iot.id',
  role: 'super_admin',
  avatar_url: null,
  full_name: 'Demo User',
};

// --- Users List ---
export const DEMO_USERS = [
  {
    id: 'demo-user-001',
    email: 'demo@synergy-iot.id',
    role: 'super_admin',
    created_at: '2025-01-01T00:00:00Z',
    last_sign_in_at: new Date().toISOString(),
  },
  {
    id: 'demo-user-002',
    email: 'operator@synergy-iot.id',
    role: 'admin',
    created_at: '2025-02-15T00:00:00Z',
    last_sign_in_at: hoursAgo(2),
  },
  {
    id: 'demo-user-003',
    email: 'viewer@synergy-iot.id',
    role: 'user',
    created_at: '2025-03-10T00:00:00Z',
    last_sign_in_at: hoursAgo(48),
  },
];

// --- Notification Preferences ---
export const DEMO_PREFERENCES = [
  { system_type: 'lingkungan', is_enabled: true },
  { system_type: 'intrusi', is_enabled: true },
  { system_type: 'keamanan', is_enabled: true },
];

// --- Telegram ---
export const DEMO_TELEGRAM_MEMBERS = {
  success: true,
  count: 2,
  data: [
    {
      user_id: '100001',
      username: 'demo_admin',
      first_name: 'Demo',
      status: 'active',
      joined_at: '2025-01-10T00:00:00Z',
      left_at: null,
      kicked_at: null,
    },
    {
      user_id: '100002',
      username: 'demo_operator',
      first_name: 'Operator',
      status: 'active',
      joined_at: '2025-02-20T00:00:00Z',
      left_at: null,
      kicked_at: null,
    },
  ],
};

// --- Lingkungan ---
export const DEMO_LINGKUNGAN_STATUS = {
  status: 'NORMAL',
  fan_state: 'OFF',
  dehumidifier_state: 'OFF',
  control_mode: 'auto',
  manual_override_until: null,
  latest_reading: {
    temperature: 26.4,
    humidity: 62.1,
    co2: 420,
    timestamp: minutesAgo(1),
  },
  latest_prediction: {
    predicted_temperature: 26.8,
    predicted_humidity: 63.0,
    predicted_co2: 425,
    timestamp: minutesAgo(1),
  },
};

function generateLingkunganChartData() {
  const actual = [];
  const predictions = [];
  const now = Date.now();
  for (let i = 59; i >= 0; i--) {
    const ts = new Date(now - i * 60_000).toISOString();
    const temp = 25 + Math.sin(i / 10) * 2 + Math.random() * 0.5;
    const hum = 60 + Math.cos(i / 8) * 5 + Math.random() * 1;
    const co2 = 400 + Math.sin(i / 12) * 40 + Math.random() * 10;
    actual.push({
      timestamp: ts,
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(hum.toFixed(1)),
      co2: parseFloat(co2.toFixed(0)),
    });
    if (i < 15) {
      predictions.push({
        timestamp: new Date(now + (15 - i) * 60_000).toISOString(),
        predicted_temperature: parseFloat((temp + 0.3).toFixed(1)),
        predicted_humidity: parseFloat((hum + 0.5).toFixed(1)),
        predicted_co2: parseFloat((co2 + 5).toFixed(0)),
      });
    }
  }
  return { actual, predictions };
}

export const DEMO_LINGKUNGAN_CHART = { data: generateLingkunganChartData() };

export const DEMO_LINGKUNGAN_LOGS = [
  {
    id: 'demo-llog-001',
    device_id: DEV_LINGKUNGAN_1,
    timestamp: minutesAgo(5),
    temperature: 26.4,
    humidity: 62.1,
    co2: 420,
    status: 'unacknowledged',
    acknowledged_by: null,
    acknowledged_at: null,
    notes: null,
    notification_sent_at: null,
  },
  {
    id: 'demo-llog-002',
    device_id: DEV_LINGKUNGAN_1,
    timestamp: minutesAgo(15),
    temperature: 28.1,
    humidity: 68.5,
    co2: 520,
    status: 'acknowledged',
    acknowledged_by: 'demo-user-001',
    acknowledged_at: minutesAgo(10),
    notes: 'Humidity tinggi, fan dinyalakan',
    notification_sent_at: minutesAgo(15),
  },
];

// --- Device Details (for getDeviceDetailsByArea) ---
export const DEMO_DEVICE_DETAILS: Record<string, any> = {
  [`${AREA1_WH1}-lingkungan`]: {
    id: DEV_LINGKUNGAN_1,
    name: 'Sensor Lingkungan A1',
    status: 'Online',
    fan_state: 'OFF',
  },
  [`${AREA2_WH1}-intrusi`]: {
    id: DEV_INTRUSI_1,
    name: 'Sensor Pintu B1',
    status: 'Online',
    door_state: 'CLOSED',
    intrusi_system_state: 'ARMED',
    siren_state: 'OFF',
    power_source: 'MAINS',
    vbat_voltage: 4.12,
    vbat_pct: 95,
  },
  [`${AREA1_WH1}-keamanan`]: {
    id: DEV_KEAMANAN_1,
    name: 'Kamera CCTV A1',
    status: 'Online',
  },
  [`${AREA1_WH2}-lingkungan`]: {
    id: DEV_LINGKUNGAN_2,
    name: 'Sensor Lingkungan C1',
    status: 'Online',
    fan_state: 'ON',
  },
};

// --- Intrusi ---
export const DEMO_INTRUSI_STATUS = {
  status: 'AMAN',
  system_state: 'ARMED',
  door_state: 'CLOSED',
  latest_event: {
    id: 'demo-ilog-001',
    device_id: DEV_INTRUSI_1,
    timestamp: minutesAgo(30),
    event_type: 'ARM',
    system_state: 'ARMED',
    door_state: 'CLOSED',
    peak_delta_g: null,
    hit_count: null,
    payload: null,
    status: 'resolved',
    acknowledged_by: 'demo-user-001',
    acknowledged_at: minutesAgo(25),
    notes: null,
    notification_sent_at: null,
    device: { id: DEV_INTRUSI_1, name: 'Sensor Pintu B1' },
  },
  latest_alarm: null,
};

export const DEMO_INTRUSI_LOGS = [
  {
    id: 'demo-ilog-001',
    device_id: DEV_INTRUSI_1,
    timestamp: minutesAgo(30),
    event_type: 'ARM',
    system_state: 'ARMED',
    door_state: 'CLOSED',
    peak_delta_g: null,
    hit_count: null,
    payload: null,
    status: 'resolved',
    acknowledged_by: 'demo-user-001',
    acknowledged_at: minutesAgo(25),
    notes: null,
    notification_sent_at: null,
    device: { id: DEV_INTRUSI_1, name: 'Sensor Pintu B1' },
  },
  {
    id: 'demo-ilog-002',
    device_id: DEV_INTRUSI_1,
    timestamp: hoursAgo(2),
    event_type: 'IMPACT_WARNING',
    system_state: 'ARMED',
    door_state: 'CLOSED',
    peak_delta_g: 1.82,
    hit_count: 3,
    payload: { magnitude: 1.82 },
    status: 'acknowledged',
    acknowledged_by: 'demo-user-002',
    acknowledged_at: hoursAgo(1),
    notes: 'Getaran kecil, bukan ancaman',
    notification_sent_at: hoursAgo(2),
    device: { id: DEV_INTRUSI_1, name: 'Sensor Pintu B1' },
  },
  {
    id: 'demo-ilog-003',
    device_id: DEV_INTRUSI_1,
    timestamp: hoursAgo(6),
    event_type: 'DISARM',
    system_state: 'DISARMED',
    door_state: 'OPEN',
    peak_delta_g: null,
    hit_count: null,
    payload: null,
    status: 'resolved',
    acknowledged_by: null,
    acknowledged_at: null,
    notes: null,
    notification_sent_at: null,
    device: { id: DEV_INTRUSI_1, name: 'Sensor Pintu B1' },
  },
  {
    id: 'demo-ilog-004',
    device_id: DEV_INTRUSI_1,
    timestamp: hoursAgo(8),
    event_type: 'FORCED_ENTRY_ALARM',
    system_state: 'ARMED',
    door_state: 'OPEN',
    peak_delta_g: 5.4,
    hit_count: 12,
    payload: { magnitude: 5.4, duration_ms: 320 },
    status: 'resolved',
    acknowledged_by: 'demo-user-001',
    acknowledged_at: hoursAgo(7),
    notes: 'False alarm — petugas mengonfirmasi.',
    notification_sent_at: hoursAgo(8),
    device: { id: DEV_INTRUSI_1, name: 'Sensor Pintu B1' },
  },
];

export const DEMO_INTRUSI_SUMMARY = {
  total_events: 4,
  alarm_events: 1,
  impact_warnings: 1,
  unacknowledged: 0,
  latest_event: DEMO_INTRUSI_LOGS[0],
};

// --- Keamanan ---
export const DEMO_KEAMANAN_LOGS = [
  {
    id: 'demo-klog-001',
    device_id: DEV_KEAMANAN_1,
    created_at: minutesAgo(10),
    image_url: '/demo-detection.svg',
    detected: true,
    box: { x: 120, y: 80, width: 200, height: 300 },
    confidence: 0.92,
    attributes: { type: 'person' },
    status: 'unacknowledged',
    notes: null,
    device: { name: 'Kamera CCTV A1' },
  },
  {
    id: 'demo-klog-002',
    device_id: DEV_KEAMANAN_1,
    created_at: hoursAgo(1),
    image_url: '/demo-detection.svg',
    detected: true,
    box: { x: 200, y: 100, width: 180, height: 280 },
    confidence: 0.87,
    attributes: { type: 'person' },
    status: 'acknowledged',
    notes: 'Petugas kebersihan',
    device: { name: 'Kamera CCTV A1' },
  },
  {
    id: 'demo-klog-003',
    device_id: DEV_KEAMANAN_1,
    created_at: hoursAgo(3),
    image_url: '/demo-detection.svg',
    detected: true,
    box: null,
    confidence: 0.65,
    attributes: { type: 'person' },
    status: 'false_alarm',
    notes: 'Bayangan terdeteksi sebagai orang',
    device: { name: 'Kamera CCTV A1' },
  },
  {
    id: 'demo-klog-004',
    device_id: DEV_KEAMANAN_1,
    created_at: hoursAgo(5),
    image_url: '/demo-detection.svg',
    detected: true,
    box: { x: 100, y: 60, width: 220, height: 310 },
    confidence: 0.95,
    attributes: { type: 'person' },
    status: 'resolved',
    notes: 'Teridentifikasi: kurir pengiriman.',
    device: { name: 'Kamera CCTV A1' },
  },
];

// --- Analytics (initial data passed to feature views) ---
export function getDemoAnalytics(systemType: string, areaId: string) {
  switch (systemType) {
    case 'keamanan':
      return {
        logs: DEMO_KEAMANAN_LOGS,
        summary: {
          total_detections: 4,
          avg_confidence: 0.85,
          unreviewed_count: 1,
          review_rate: 75,
        },
        area: DEMO_AREAS.find((a) => a.id === areaId) || DEMO_AREAS[0],
        device: DEMO_DEVICES.find(
          (d) => d.area_id === areaId && d.system_type === 'keamanan'
        ) || DEMO_DEVICES[2],
        pagination: { page: 1, per_page: 25, total: 4, total_pages: 1 },
      };

    case 'intrusi':
      return {
        logs: DEMO_INTRUSI_LOGS,
        summary: DEMO_INTRUSI_SUMMARY,
        area: DEMO_AREAS.find((a) => a.id === areaId) || DEMO_AREAS[1],
        device: DEMO_DEVICES.find(
          (d) => d.area_id === areaId && d.system_type === 'intrusi'
        ) || DEMO_DEVICES[1],
        pagination: { page: 1, per_page: 25, total: 4, total_pages: 1 },
      };

    case 'lingkungan':
      return {
        logs: DEMO_LINGKUNGAN_LOGS,
        area: DEMO_AREAS.find((a) => a.id === areaId) || DEMO_AREAS[0],
        device: DEMO_DEVICES.find(
          (d) => d.area_id === areaId && d.system_type === 'lingkungan'
        ) || DEMO_DEVICES[0],
        pagination: { page: 1, per_page: 25, total: 2, total_pages: 1 },
      };

    default:
      return null;
  }
}

// --- Verify Access ---
export const DEMO_VERIFY_ACCESS = {
  authorized: true,
  message: 'Demo mode',
};

// --- VAPID ---
export const DEMO_VAPID = {
  publicKey: 'demo-vapid-public-key',
};
