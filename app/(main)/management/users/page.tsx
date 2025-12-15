// frontend/app/(main)/management/users/page.tsx
import { getUsers, User } from "@/lib/api";
import {
  InviteUserButton,
  UserActionButtons,
} from "@/components/actions/UserActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { cache } from "react";
import { Separator } from "@/components/ui/separator";
import TelegramManager from "@/components/telegram/TelegramManager";

// Cache users data with shorter TTL since it can change
const getCachedUsers = cache(async (token: string) => {
  return await getUsers(token);
});

export default async function ManageUsersPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const users: User[] = await getCachedUsers(session.access_token);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
        <InviteUserButton />
      </div>
      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir Login</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              // Cek status berdasarkan kolom 'banned_until' dari Supabase
              const isInactive =
                user.banned_until && new Date(user.banned_until) > new Date();
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "neutral"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isInactive ? "neutral" : "default"}
                      className={!isInactive ? "bg-green-600" : ""}
                    >
                      {isInactive ? "Nonaktif" : "Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at
                      ? format(new Date(user.last_sign_in_at), "dd MMM yyyy")
                      : "Belum Pernah"}
                  </TableCell>
                  <TableCell>
                    <UserActionButtons user={user} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Separator */}
      <Separator className="my-8" />

      {/* Telegram Integration Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Integrasi Grup Telegram</h2>
        <TelegramManager />
      </div>
    </div>
  );
}
