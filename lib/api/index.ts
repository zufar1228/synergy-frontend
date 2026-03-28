// frontend/lib/api/index.ts
//
// Barrel re-export for backward compatibility.
// All existing `import { ... } from '@/lib/api'` statements continue to work.
//

// Types
export type {
  Warehouse,
  Area,
  Device,
  MqttCredentials,
  CreateDeviceResponse,
  User,
  Profile,
  VerifyAccessResponse,
  WarehouseDetails,
  NavArea,
  AnalyticsParams,
  Incident,
  UpdateIncidentStatusPayload,
  ActiveAlert,
  NotificationPreference,
  KeamananLog,
  EnvironmentDeviceStatus,
  TelegramSubscriber,
  TelegramInviteResponse,
  TelegramMembersResponse,
  IntrusiEventType,
  DoorState,
  SystemState,
  AcknowledgeStatus,
  IntrusiLog,
  IntrusiSummary,
  IntrusiStatus,
  IntrusiCommandType,
  IntrusiCommandPayload,
  LingkunganLog,
  LingkunganStatus
} from './types';

// Functions
export {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouseDetails
} from './warehouses';
export {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  getAreasByWarehouse
} from './areas';
export {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceDetailsByArea
} from './devices';
export {
  verifyUserAccess,
  getUsers,
  inviteUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  updateUserStatus,
  getMyPreferences,
  updateMyPreferences,
  getVapidPublicKey,
  subscribeToPush,
  testPushNotification
} from './users';
export { getNavAreasBySystem } from './navigation';
export { getAnalytics, getAnalyticsDataForSystem } from './analytics';
export {
  getActiveAlerts,
  updateIncidentStatus,
  updateKeamananLogStatus
} from './alerts';
export {
  getIntrusiLogs,
  getIntrusiSummary,
  getIntrusiStatus,
  updateIntrusiLogStatus,
  sendIntrusiCommand
} from '@/features/intrusi/api/intrusi';
export {
  getLingkunganStatus,
  getLingkunganChart,
  sendLingkunganControl,
  updateLingkunganLogStatus
} from '@/features/lingkungan/api/lingkungan';
export {
  getTelegramMembers,
  generateTelegramInvite,
  kickTelegramMember,
  sendTelegramTestAlert
} from './telegram';
