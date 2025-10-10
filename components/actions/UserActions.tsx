"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  inviteUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  User,
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  role: z.enum(["admin", "user"], { message: "Peran harus dipilih." }),
});

type InviteFormData = z.infer<typeof formSchema>;

const InviteUserForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const form = useForm<InviteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: undefined,
    },
  });

  async function onSubmit(values: InviteFormData) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Sesi tidak valid.");

    try {
      await inviteUser(values, session.access_token);
      toast.success(`Undangan berhasil dikirim ke ${values.email}`);
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Pengguna</FormLabel>
              <FormControl>
                <Input placeholder="pengguna@contoh.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Mengirim..." : "Kirim Undangan"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const InviteUserButton = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Undang Pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undang Pengguna Baru</DialogTitle>
        </DialogHeader>
        <InviteUserForm
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const UserActionButtons = ({ user }: { user: User }) => {
  const router = useRouter();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "user">(user.role);

  const handleDelete = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Sesi tidak valid.");

    try {
      await deleteUser(user.id, session.access_token);
      toast.success(`Pengguna "${user.email}" berhasil dihapus.`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleAction = async (
    action: () => Promise<any>,
    successMessage: string
  ) => {
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleChangeRole = () => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return toast.error("Sesi tidak valid.");
      handleAction(
        () => updateUserRole(user.id, newRole, session.access_token),
        `Peran untuk ${user.email} berhasil diubah.`
      );
      setIsRoleDialogOpen(false);
    });
  };

  const handleChangeStatus = (status: "active" | "inactive") => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return toast.error("Sesi tidak valid.");
      handleAction(
        () => updateUserStatus(user.id, status, session.access_token),
        `Status ${user.email} berhasil diubah.`
      );
    });
  };

  const isInactive =
    user.banned_until && new Date(user.banned_until) > new Date();

  return (
    <div className="text-right">
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setIsRoleDialogOpen(true)}>
                Ubah Peran
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  handleChangeStatus(isInactive ? "active" : "inactive")
                }
              >
                {isInactive ? "Aktifkan Pengguna" : "Nonaktifkan Pengguna"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive">
                  Hapus
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Anda yakin ingin menghapus "{user.email}"?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Aksi ini akan menghapus pengguna secara permanen.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Ya, Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog untuk Ubah Peran */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Peran untuk {user.email}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Peran Baru</Label>
            <Select
              value={newRole}
              onValueChange={(value: "admin" | "user") => setNewRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRoleDialogOpen(false)}>Batal</Button>
            <Button onClick={handleChangeRole}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
