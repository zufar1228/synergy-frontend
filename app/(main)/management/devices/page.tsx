// frontend/app/(main)/management/devices/page.tsx

import { getDevices, Device } from "@/lib/api";
import {
  AddDeviceButton,
  DeviceActionButtons,
} from "@/components/actions/DeviceActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/shared/copy-button"; // <-- IMPORT KOMPONEN BARU

export default async function ManageDevicesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const devices: Device[] = await getDevices(session.access_token);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Perangkat</h1>
        <AddDeviceButton />
      </div>
      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Perangkat</TableHead>
              <TableHead>Tipe Sistem</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Gudang</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">
                  {/* --- PERUBAHAN DI SINI --- */}
                  <div className="flex items-center gap-2">
                    <span>{device.name}</span>
                    <CopyButton textToCopy={device.id} />
                  </div>
                </TableCell>
                <TableCell>{device.system_type}</TableCell>
                <TableCell>
                  {/* --- PERUBAHAN DI SINI --- */}
                  {device.area && (
                    <div className="flex items-center gap-2">
                      <span>{device.area.name}</span>
                      <CopyButton textToCopy={device.area.id} />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {/* --- PERUBAHAN DI SINI --- */}
                  {device.area?.warehouse && (
                    <div className="flex items-center gap-2">
                      <span>{device.area.warehouse.name}</span>
                      <CopyButton textToCopy={device.area.warehouse.id} />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DeviceActionButtons device={device} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
