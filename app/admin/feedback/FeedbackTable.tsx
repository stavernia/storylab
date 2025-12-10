"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminFeedback = {
  id: string;
  message: string;
  status: string; // FeedbackStatus enum value as string
  pagePath?: string | null;
  userEmail?: string;
  userName?: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  WAITING: "Waiting",
  IN_PROGRESS: "In Progress",
  CANCELLED: "Cancelled",
  COMPLETE: "Complete",
};

const statusOrder = ["WAITING", "IN_PROGRESS", "CANCELLED", "COMPLETE"];

export function FeedbackTable({ feedback }: { feedback: AdminFeedback[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isPending, startTransition] = useTransition();

  const filteredFeedback = useMemo(() => {
    const filtered = feedback.filter((entry) =>
      statusFilter === "ALL" ? true : entry.status === statusFilter,
    );

    return filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();

      return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
    });
  }, [feedback, sortOrder, statusFilter]);

  const updateStatus = async (feedbackId: string, status: string) => {
    const response = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message =
        typeof data.error === "string"
          ? data.error
          : "Failed to update feedback";
      throw new Error(message);
    }
  };

  const handleStatusChange = (feedbackId: string, status: string) => {
    startTransition(async () => {
      try {
        await updateStatus(feedbackId, status);
        toast.success(`Status updated to ${statusLabels[status]}`);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update feedback";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as string | "ALL")}
          disabled={isPending}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statusOrder.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSortOrder((order) => (order === "desc" ? "asc" : "desc"))
          }
          className="inline-flex items-center gap-2"
        >
          {sortOrder === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          <span>
            Sort by date ({sortOrder === "desc" ? "newest" : "oldest"} first)
          </span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-32">Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-32">Page</TableHead>
              <TableHead className="w-44">Contact</TableHead>
              <TableHead className="w-40">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedback.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-slate-600"
                >
                  No feedback yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredFeedback.map((entry) => {
                const created = new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.createdAt));

                return (
                  <TableRow key={entry.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {statusLabels[entry.status]}
                        </Badge>
                        <Select
                          defaultValue={entry.status}
                          onValueChange={(value) =>
                            handleStatusChange(entry.id, value as string)
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOrder.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {entry.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {entry.pagePath ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {entry.userName
                        ? `${entry.userName} • ${entry.userEmail ?? "No email"}`
                        : (entry.userEmail ?? "—")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {created}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
