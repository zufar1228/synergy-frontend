// frontend/components/telegram/TelegramManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getTelegramMembers,
  generateTelegramInvite,
  kickTelegramMember,
  sendTelegramTestAlert,
  TelegramSubscriber,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Send,
  UserMinus,
  RefreshCw,
  Copy,
  Check,
  Users,
  MessageSquare,
  Link2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const TelegramManager = () => {
  const [members, setMembers] = useState<TelegramSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const supabase = createClient();

  // --- Fetch Data Member ---
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const data = await getTelegramMembers(session.access_token, showInactive);
      setMembers(data);
    } catch (error) {
      toast.error("Gagal memuat member Telegram");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showInactive, supabase.auth]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // --- Handler Generate Link ---
  const handleGenerateLink = async () => {
    setInviteLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await generateTelegramInvite(session.access_token);
      setInviteLink(res.invite_link);
      toast.success("Link undangan dibuat (berlaku 10 menit)");
    } catch (error) {
      toast.error("Gagal membuat link undangan");
      console.error(error);
    } finally {
      setInviteLoading(false);
    }
  };

  // --- Handler Copy Link ---
  const handleCopy = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Link disalin ke clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Gagal menyalin link");
      }
    }
  };

  // --- Handler Test Alert ---
  const handleTestAlert = async () => {
    setTestAlertLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await sendTelegramTestAlert(session.access_token);
      toast.success("Pesan tes berhasil dikirim ke grup Telegram!");
    } catch (error) {
      toast.error("Gagal mengirim pesan tes");
      console.error(error);
    } finally {
      setTestAlertLoading(false);
    }
  };

  // --- Handler Kick Member ---
  const handleKick = async (userId: string, name: string) => {
    if (!confirm(`Yakin ingin mengeluarkan ${name} dari grup Telegram?`)) return;

    setKickingUserId(userId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await kickTelegramMember(session.access_token, userId);
      toast.success(`${name} berhasil dikeluarkan dari grup.`);
      fetchMembers(); // Refresh list
    } catch (error) {
      toast.error("Gagal mengeluarkan member");
      console.error(error);
    } finally {
      setKickingUserId(null);
    }
  };

  // --- Get status badge ---
  const getStatusBadge = (status: TelegramSubscriber["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 hover:bg-green-700">Aktif</Badge>;
      case "left":
        return <Badge variant="neutral">Keluar</Badge>;
      case "kicked":
        return <Badge className="bg-red-600 hover:bg-red-700 text-white">Dikeluarkan</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* BAGIAN 1: HEADER & ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Generate Invite Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              Undang ke Grup Telegram
            </CardTitle>
            <CardDescription>
              Buat link sekali pakai untuk mengundang user baru ke grup
              notifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!inviteLink ? (
              <Button
                onClick={handleGenerateLink}
                disabled={inviteLoading}
                className="w-full"
              >
                {inviteLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Buat Link Undangan (10 Menit)
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border font-mono text-sm break-all">
                  <span className="truncate flex-1">{inviteLink}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="neutral"
                    className="flex-1"
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Tersalin!" : "Salin Link"}
                  </Button>
                  <Button onClick={() => setInviteLink(null)} variant="muted">
                    Tutup
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Link ini hanya bisa dipakai oleh 1 orang dan berlaku 10
                  menit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Test Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Tes Koneksi Bot
            </CardTitle>
            <CardDescription>
              Kirim pesan tes ke grup untuk memastikan bot terhubung dengan
              benar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                <span className="font-medium">Bot Telegram Aktif</span>
              </div>
              <Button
                variant="neutral"
                size="sm"
                onClick={fetchMembers}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <Button
              onClick={handleTestAlert}
              disabled={testAlertLoading}
              variant="neutral"
              className="w-full"
            >
              {testAlertLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Kirim Pesan Tes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* BAGIAN 2: TABEL MEMBER */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anggota Grup Telegram
              </CardTitle>
              <CardDescription>
                Daftar user yang tercatat di database dari grup monitoring.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Tampilkan Tidak Aktif
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama / Username</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada anggota tercatat.</p>
                    <p className="text-xs mt-1">
                      Data akan muncul setelah user join melalui webhook.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {member.first_name || "Tanpa Nama"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.username
                          ? `@${member.username}`
                          : `ID: ${member.user_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(member.joined_at),
                        "dd MMM yyyy, HH:mm",
                        { locale: indonesia }
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-right">
                      {member.status === "active" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleKick(
                              member.user_id,
                              member.first_name || "User"
                            )
                          }
                          disabled={kickingUserId === member.user_id}
                        >
                          {kickingUserId === member.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramManager;
