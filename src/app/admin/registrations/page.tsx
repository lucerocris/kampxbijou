"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AdminPageHeader from "@/components/AdminPageHeader";
import { RegistrationsDataTable } from "@/components/admin/registration-data-table";
import {
  type Registration,
  registrationColumns,
} from "@/components/admin/registration-columns";

export default function Registrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");

      setRegistrations((data?.registrations ?? []) as Registration[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const updateVerification = async (
    id: string,
    verification: "pending" | "accepted" | "rejected"
  ) => {
    const prev = registrations;

    // optimistic update
    setRegistrations((curr) =>
      curr.map((r) => (r.id === id ? { ...r, verification } : r))
    );

    try {
      const res = await fetch("/api/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verification }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update");

      const updated = data?.registration as Registration | undefined;
      if (updated?.id) {
        setRegistrations((curr) =>
          curr.map((r) => (r.id === updated.id ? updated : r))
        );
      }

      toast.success(
        verification === "accepted" ? "Payment accepted" : "Payment rejected"
      );
    } catch (e) {
      console.error(e);
      setRegistrations(prev);
      toast.error("Failed to update verification");
    }
  };

  const handleAccept = async (id: string) => updateVerification(id, "accepted");
  const handleReject = async (id: string) => updateVerification(id, "rejected");

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/registrations?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete");

      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Registrations"
        subtitle="View submitted forms and verify payment proofs."
      />

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <RegistrationsDataTable
          columns={registrationColumns}
          data={registrations}
          onAccept={handleAccept}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
