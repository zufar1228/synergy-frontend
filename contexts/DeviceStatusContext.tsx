"use client";

import {
  createContext,
  useReducer,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface DeviceStatus {
  deviceId: string;
  areaId: string;
  systemType: string;
  isOnline: boolean;
  lastActivity: Date | null;
}

interface DeviceStatusState {
  statuses: Map<string, DeviceStatus>;
}

type DeviceStatusAction =
  | { type: "UPDATE"; key: string; payload: DeviceStatus }
  | { type: "CLEANUP" };

const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const ONLINE_CHECK_MS = 5 * 60 * 1000; // 5 minutes

function deviceStatusReducer(
  state: DeviceStatusState,
  action: DeviceStatusAction
): DeviceStatusState {
  switch (action.type) {
    case "UPDATE": {
      const newMap = new Map(state.statuses);
      newMap.set(action.key, action.payload);
      return { statuses: newMap };
    }
    case "CLEANUP": {
      const now = Date.now();
      const newMap = new Map(state.statuses);
      let hasChanges = false;
      for (const [key, status] of newMap) {
        if (
          status.lastActivity &&
          status.isOnline &&
          now - status.lastActivity.getTime() > OFFLINE_THRESHOLD_MS
        ) {
          newMap.set(key, { ...status, isOnline: false });
          hasChanges = true;
        }
      }
      return hasChanges ? { statuses: newMap } : state; // no re-render if nothing changed
    }
    default:
      return state;
  }
}

interface DeviceStatusContextType {
  deviceStatuses: Map<string, DeviceStatus>;
  updateDeviceStatus: (
    areaId: string,
    systemType: string,
    isOnline: boolean
  ) => void;
  getDeviceStatus: (areaId: string, systemType: string) => boolean;
  isDeviceOnline: (areaId: string, systemType: string) => boolean;
}

const DeviceStatusContext = createContext<DeviceStatusContextType | undefined>(
  undefined
);

export const DeviceStatusProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(deviceStatusReducer, {
    statuses: new Map(),
  });

  // Clean up old statuses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "CLEANUP" });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateDeviceStatus = useCallback(
    (areaId: string, systemType: string, isOnline: boolean) => {
      const key = `${areaId}-${systemType}`;
      dispatch({
        type: "UPDATE",
        key,
        payload: {
          deviceId: "",
          areaId,
          systemType,
          isOnline,
          lastActivity: new Date(),
        },
      });
    },
    []
  );

  const getDeviceStatus = useCallback(
    (areaId: string, systemType: string): boolean => {
      const key = `${areaId}-${systemType}`;
      const status = state.statuses.get(key);
      return status?.isOnline || false;
    },
    [state.statuses]
  );

  const isDeviceOnline = useCallback(
    (areaId: string, systemType: string): boolean => {
      const key = `${areaId}-${systemType}`;
      const status = state.statuses.get(key);

      if (!status) return false;

      if (status.lastActivity) {
        const timeSinceActivity = Date.now() - status.lastActivity.getTime();
        return timeSinceActivity < ONLINE_CHECK_MS;
      }

      return status.isOnline;
    },
    [state.statuses]
  );

  return (
    <DeviceStatusContext.Provider
      value={{
        deviceStatuses: state.statuses,
        updateDeviceStatus,
        getDeviceStatus,
        isDeviceOnline,
      }}
    >
      {children}
    </DeviceStatusContext.Provider>
  );
};

export const useDeviceStatus = (): DeviceStatusContextType => {
  const context = useContext(DeviceStatusContext);
  if (context === undefined) {
    throw new Error(
      "useDeviceStatus must be used within a DeviceStatusProvider"
    );
  }
  return context;
};
