"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar, ClipboardList } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { useParams } from "next/navigation";

export default function StaffDetailsPage() {
  const params = useParams();
  const staffId = params.id;
  const toast = useToastContext();
  
  // Modals state
  const [shiftOpen, setShiftOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);
  const [deleteShift, setDeleteShift] = useState(null);

  const { data: staffProfile, isLoading: isStaffLoading } = useSWR(
    staffId ? `/api/staff/admin/employees/${staffId}/` : null,
    (url) => api.get(url)
  );

  const { data: shiftsRaw, mutate: mutateShifts } = useSWR(
    staffId ? `/api/staff/admin/shifts/?staff_id=${staffId}` : null,
    (url) => api.get(url)
  );
  
  const { data: tasksRaw, mutate: mutateTasks } = useSWR(
    staffId ? `/api/staff/admin/tasks/?staff_id=${staffId}` : null,
    (url) => api.get(url)
  );

  const shifts = shiftsRaw?.results || (Array.isArray(shiftsRaw) ? shiftsRaw : []);
  const tasks = tasksRaw?.results || (Array.isArray(tasksRaw) ? tasksRaw : []);

  const handleCreateShift = async (values) => {
    try {
      await api.post("/api/staff/admin/shifts/", { ...values, staff: staffId });
      toast.success("Shift added successfully");
      setShiftOpen(false);
      mutateShifts();
    } catch (err) {
      toast.error(err?.message || "Failed to add shift");
    }
  };

  const handleCreateTask = async (values) => {
    try {
      await api.post("/api/staff/admin/tasks/", { ...values, staff: staffId });
      toast.success("Task added successfully");
      setTaskOpen(false);
      mutateTasks();
    } catch (err) {
      toast.error(err?.message || "Failed to add task");
    }
  };

  const handleDeleteShift = async () => {
    try {
      await api.delete(`/api/staff/admin/shifts/${deleteShift.id}/`);
      toast.success("Shift deleted");
      setDeleteShift(null);
      mutateShifts();
    } catch (err) {
      toast.error("Failed to delete shift");
    }
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/api/staff/admin/tasks/${deleteTask.id}/`);
      toast.success("Task deleted");
      setDeleteTask(null);
      mutateTasks();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  if (isStaffLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!staffProfile) return <div className="p-8 text-center text-red-500">Staff member not found</div>;

  const shiftFields = [
    { key: "date", label: "Date", required: true, type: "date" },
    { key: "start_time", label: "Start Time", type: "time" },
    { key: "end_time", label: "End Time", type: "time" },
    { key: "break_duration_minutes", label: "Break Duration (mins)", type: "number", placeholder: "30" },
    { key: "location", label: "Location", placeholder: "e.g. Móstoles Centro" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "DAY_OFF", label: "Day Off" },
      { value: "ABSENT", label: "Absent" },
    ]},
  ];

  const taskFields = [
    { key: "title", label: "Task Title", required: true, placeholder: "e.g. Package Organic Honey" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "PENDING", label: "Pending" },
      { value: "IN_PROGRESS", label: "In Progress" },
      { value: "COMPLETED", label: "Completed" },
    ]},
  ];

  const shiftColumns = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time", render: (_, row) => row.start_time && row.end_time ? `${row.start_time.slice(0,5)} - ${row.end_time.slice(0,5)}` : "—" },
    { key: "status", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full ${v === 'DAY_OFF' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{v}</span> },
    { key: "location", label: "Location", render: (v) => v || "—" },
  ];

  const taskColumns = [
    { key: "title", label: "Title" },
    { key: "status", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full ${v === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
    { key: "progress_percentage", label: "Progress", render: (v) => `${v}%` },
    { key: "created_at", label: "Created", render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <Container title={`Staff: ${staffProfile.user?.name}`} description={`${staffProfile.role} • ${staffProfile.branch_location}`}>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Shifts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold flex items-center gap-2"><Calendar size={18} className="text-slate-500" /> Shifts</h3>
            <button onClick={() => setShiftOpen(true)} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="p-0">
            <DataTable 
              columns={shiftColumns} 
              data={shifts} 
              actions={(row) => (
                <button onClick={() => setDeleteShift(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
              )}
            />
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold flex items-center gap-2"><ClipboardList size={18} className="text-slate-500" /> Tasks</h3>
            <button onClick={() => setTaskOpen(true)} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="p-0">
            <DataTable 
              columns={taskColumns} 
              data={tasks} 
              actions={(row) => (
                <button onClick={() => setDeleteTask(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
              )}
            />
          </div>
        </div>

      </div>

      {/* Modals */}
      <Modal open={shiftOpen} onClose={() => setShiftOpen(false)} title="Add Shift">
        <FormModal fields={shiftFields} onSubmit={handleCreateShift} submitLabel="Save Shift" />
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add Task">
        <FormModal fields={taskFields} onSubmit={handleCreateTask} submitLabel="Save Task" />
      </Modal>

      <ConfirmDialog open={!!deleteShift} onClose={() => setDeleteShift(null)} onConfirm={handleDeleteShift} title="Delete Shift" message="Are you sure you want to delete this shift?" />
      <ConfirmDialog open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDeleteTask} title="Delete Task" message="Are you sure you want to delete this task?" />

    </Container>
  );
}
