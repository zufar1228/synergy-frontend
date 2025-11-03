"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface DeviceStatus {
  deviceId: string;
  areaId: string;
  systemType: string;
  isOnline: boolean;
  lastActivity: Date | null;
}

interface DeviceStatusContextType {
  deviceStatuses: Map<string, DeviceStatus>; // key: `${areaId}-${systemType}`
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
  const [deviceStatuses, setDeviceStatuses] = useState<
    Map<string, DeviceStatus>
  >(new Map());

  // Clean up old statuses periodically (devices inactive for more than 10 minutes)
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      setDeviceStatuses((prev) => {
        const newMap = new Map(prev);
        for (const [key, status] of newMap) {
          if (
            status.lastActivity &&
            now - status.lastActivity.getTime() > 10 * 60 * 1000
          ) {
            // Device hasn't been active for 10 minutes, mark as offline
            newMap.set(key, { ...status, isOnline: false });
          }
        }
        return newMap;
      });
    };

    const interval = setInterval(cleanup, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const updateDeviceStatus = (
    areaId: string,
    systemType: string,
    isOnline: boolean
  ) => {
    const key = `${areaId}-${systemType}`;
    setDeviceStatuses((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(key);
      newMap.set(key, {
        deviceId: existing?.deviceId || "",
        areaId,
        systemType,
        isOnline,
        lastActivity: new Date(),
      });
      return newMap;
    });
  };

  const getDeviceStatus = (areaId: string, systemType: string): boolean => {
    const key = `${areaId}-${systemType}`;
    const status = deviceStatuses.get(key);
    return status?.isOnline || false;
  };

  const isDeviceOnline = (areaId: string, systemType: string): boolean => {
    const key = `${areaId}-${systemType}`;
    const status = deviceStatuses.get(key);

    if (!status) return false; // No status means we don't know, assume offline

    // Check if device has been active within last 5 minutes
    if (status.lastActivity) {
      const timeSinceActivity = Date.now() - status.lastActivity.getTime();
      return timeSinceActivity < 5 * 60 * 1000; // 5 minutes
    }

    return status.isOnline;
  };

  return (
    <DeviceStatusContext.Provider
      value={{
        deviceStatuses,
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
