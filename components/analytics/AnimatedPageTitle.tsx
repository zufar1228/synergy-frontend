'use client';

import React, { useMemo } from 'react';
import { useNavAreas } from '@/hooks/use-nav-areas';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';

interface AnimatedPageTitleProps {
  systemType: 'intrusi' | 'lingkungan' | 'keamanan';
  areaId: string;
  deviceName?: string;
}

export function AnimatedPageTitle({ systemType, areaId, deviceName }: AnimatedPageTitleProps) {
  const { securityAreas, intrusiAreas, lingkunganAreas } = useNavAreas();

  // Find the exact area safely
  const area = useMemo(() => {
    switch (systemType) {
      case 'keamanan': return securityAreas.find(a => a.id === areaId);
      case 'intrusi': return intrusiAreas.find(a => a.id === areaId);
      case 'lingkungan': return lingkunganAreas.find(a => a.id === areaId);
      default: return undefined;
    }
  }, [systemType, areaId, securityAreas, intrusiAreas, lingkunganAreas]);

  const words = useMemo(() => {
    const list: string[] = [];
    
    // Add Warehouse Name
    if (area?.warehouse_name) list.push(area.warehouse_name);
    
    // Add Area Name
    if (area?.name) list.push(`Area: ${area.name}`);
    
    // Add Device / System Type Name
    if (systemType === 'keamanan') {
      list.push("Sistem Keamanan Pusat");
    } else if (deviceName) {
      list.push(`Perangkat: ${deviceName}`);
    } else {
        list.push("Sistem " + systemType)
    }
    
    // Fallback if data is entirely missing (prevent crash)
    if (list.length === 0) return ["Memuat..."];
    
    return list;
  }, [area, deviceName, systemType]);

  return (
    <ContainerTextFlip 
      words={words} 
      interval={5000} 
    />
  );
}
