"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  disabled: boolean;
  createdAt: string;
};

const roleLabels: Record<AdminUser["role"], string> = {
  ADMIN: "Admin",
  USER: "User",
};

export function UserTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }),
    [],
  );

  const updateUser = async (payload: Partial<Pick<AdminUser, "role" | "disabled">> & { userId: string }) => {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = typeof data.error === "string" ? data.error : "Failed to update user";
      throw new Error(message);
    }
  };

  const handleDisabledChange = (userId: string, disabled: boolean) => {
    startTransition(async () => {
      try {
        await updateUser({ userId, disabled });
        toast.success(disabled ? "User disabled" : "User enabled");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        toast.error(message);
      }
    });
  };

  const handleRoleChange = (userId: string, role: AdminUser["role"]) => {
    startTransition(async () => {
      try {
        await updateUser({ userId, role });
        toast.success(`Role updated to ${roleLabels[role]}`);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        toast.error(message);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-slate-50/80">
              <TableCell className="font-medium text-slate-900">{user.name ?? "Unknown user"}</TableCell>
              <TableCell className="text-slate-700">{user.email ?? "—"}</TableCell>
              <TableCell className="text-slate-700">
                {user.createdAt ? dateFormatter.format(new Date(user.createdAt)) : "—"}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value as AdminUser["role"])}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!user.disabled}
                    onCheckedChange={(checked) => handleDisabledChange(user.id, !checked)}
                    disabled={isPending}
                  />
                  <Badge variant={user.disabled ? "destructive" : "secondary"}>
                    {user.disabled ? "Disabled" : "Active"}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
