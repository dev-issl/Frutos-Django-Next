"use client";

import { useState } from "react";
import { Check, X, Calendar, Clock, Eye, AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

export default function RequestDaysPage() {
  const toast = useToastContext();
  const [page, setPage] = useState(1);
  const [viewRequest, setViewRequest] = useState(null); // The row object
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: rawData, isLoading, mutate } = useSWR(
    ["admin-day-off-requests", page],
    () => api.get(`/api/staff/admin/day-off-requests/?page=${page}&page_size=${PAGE_SIZE}`),
    { revalidateOnFocus: false }
  );

  const data = rawData?.results || (Array.isArray(rawData) ? rawData : []);
  const totalCount = rawData?.count || data.length;

  const handleUpdateStatus = async (id, status) => {
    setIsUpdating(true);
    try {
      await api.patch(`/api/staff/admin/day-off-requests/${id}/`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setViewRequest(null);
      mutate();
    } catch (err) {
      toast.error(err?.message || "Failed to update request");
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { 
      key: "staff", 
      label: "Staff Name", 
      render: (v, row) => (
        <span className="font-medium text-slate-700">{row.staff?.user?.name || `Staff #${row.staff}`}</span>
      )
    },
    { 
      key: "date", 
      label: "Date", 
      render: (v) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-4 h-4" />
          {new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )
    },
    { 
      key: "status", 
      label: "Status", 
      render: (v) => {
        if (v === "APPROVED") {
          return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><Check className="w-3 h-3" /> Approved</span>;
        } else if (v === "REJECTED") {
          return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><X className="w-3 h-3" /> Rejected</span>;
        } else {
          return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
        }
      } 
    },
    {
      key: "actions",
      label: "Actions",
      render: (v, row) => {
        return (
          <button
            onClick={() => setViewRequest(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-[#00694C] hover:text-white border border-slate-200 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" /> View
          </button>
        );
      }
    }
  ];

  return (
    <Container
      title="Request Days"
      description="Manage staff day off requests"
      icon={CalendarDays}
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          onRowClick={(row) => setViewRequest(row)}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            totalCount,
            onPageChange: setPage,
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <CalendarDays className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">No requests found</h3>
              <p className="text-sm text-slate-500">There are no day off requests to review at this time.</p>
            </div>
          }
        />
      </div>

      <Modal
        open={!!viewRequest}
        onClose={() => !isUpdating && setViewRequest(null)}
        maxWidth="max-w-xl"
      >
        {viewRequest && (
          <div className="flex flex-col gap-6">
            {/* Letter Header */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-[#F1F6EB] rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6 text-[#00694C]" />
              </div>
              <h2 className="text-xl font-serif text-[#004A3A] font-semibold">Leave Application</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Ref: REQ-{String(viewRequest.id).padStart(4, '0')}</p>
            </div>

            {/* Letter Content */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-slate-700 text-sm leading-relaxed font-serif relative">
              {viewRequest.status !== "PENDING" && (
                <div className="absolute top-4 right-4 rotate-12 opacity-80 pointer-events-none">
                  <div className={`px-4 py-1.5 border-2 rounded-lg font-bold text-sm tracking-widest uppercase ${
                    viewRequest.status === 'APPROVED' ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600'
                  }`}>
                    {viewRequest.status}
                  </div>
                </div>
              )}

              <p className="mb-4">
                <strong>Date:</strong> {new Date(viewRequest.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <p className="mb-6">
                <strong>To:</strong> Management & Administration<br />
                <strong>From:</strong> {viewRequest.staff?.user?.name || `Staff #${viewRequest.staff}`}<br />
                <strong>Subject: Request for Day Off on {new Date(viewRequest.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
              
              <p className="mb-4">Dear Admin,</p>
              
              <p className="mb-4">
                I am writing to formally request a day off on <strong>{new Date(viewRequest.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              
              <p className="mb-2"><strong>Reason for the request:</strong></p>
              <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 italic whitespace-pre-wrap font-sans text-slate-600 shadow-sm">
                "{viewRequest.reason}"
              </div>
              
              <p className="mb-6">
                Thank you for considering my application.
              </p>
              
              <p>
                Sincerely,<br />
                <strong>{viewRequest.staff?.user?.name || `Staff #${viewRequest.staff}`}</strong>
              </p>
            </div>

            {/* Actions */}
            {viewRequest.status === "PENDING" && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={isUpdating}
                  onClick={() => setViewRequest(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(viewRequest.id, 'REJECTED')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(viewRequest.id, 'APPROVED')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-[#00694C] text-white hover:bg-[#004A3A] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve Request
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Container>
  );
}
