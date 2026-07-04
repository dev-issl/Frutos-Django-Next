"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar, ClipboardList, Edit, Ban, MapPin, ChevronLeft } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { useParams, useRouter } from "next/navigation";

export default function StaffDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id;
  const toast = useToastContext();
  
  // Modals state
  const [activeTab, setActiveTab] = useState("SHIFTS");
  const [shiftOpen, setShiftOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [offDayOpen, setOffDayOpen] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [editOffDay, setEditOffDay] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [deleteShift, setDeleteShift] = useState(null);
  const [deleteOffDay, setDeleteOffDay] = useState(null);

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

  const allShifts = shiftsRaw?.results || (Array.isArray(shiftsRaw) ? shiftsRaw : []);
  const shifts = allShifts.filter(s => s.status !== 'DAY_OFF');
  const offDays = allShifts.filter(s => s.status === 'DAY_OFF');
  const tasks = tasksRaw?.results || (Array.isArray(tasksRaw) ? tasksRaw : []);

  const handleSaveShift = async (values) => {
    try {
      if (editShift) {
        await api.patch(`/api/staff/admin/shifts/${editShift.id}/`, values);
        toast.success("Shift updated successfully");
      } else {
        await api.post("/api/staff/admin/shifts/", { ...values, staff: staffId });
        toast.success("Shift added successfully");
      }
      setShiftOpen(false);
      setEditShift(null);
      mutateShifts();
    } catch (err) {
      toast.error(err?.message || "Failed to save shift");
    }
  };

  const handleSaveTask = async (values) => {
    try {
      if (editTask) {
        await api.patch(`/api/staff/admin/tasks/${editTask.id}/`, values);
        toast.success("Task updated successfully");
      } else {
        await api.post("/api/staff/admin/tasks/", { ...values, staff: staffId });
        toast.success("Task added successfully");
      }
      setTaskOpen(false);
      setEditTask(null);
      mutateTasks();
    } catch (err) {
      toast.error(err?.message || "Failed to save task");
    }
  };

  const handleSaveOffDay = async (values) => {
    try {
      const payload = { ...values, status: 'DAY_OFF', staff: staffId };
      if (editOffDay) {
        await api.patch(`/api/staff/admin/shifts/${editOffDay.id}/`, payload);
        toast.success("Off Day updated");
      } else {
        await api.post("/api/staff/admin/shifts/", payload);
        toast.success("Off Day added");
      }
      setOffDayOpen(false);
      setEditOffDay(null);
      mutateShifts();
    } catch (err) {
      toast.error(err?.message || "Failed to save off day");
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

  const handleDeleteOffDay = async () => {
    try {
      await api.delete(`/api/staff/admin/shifts/${deleteOffDay.id}/`);
      toast.success("Off Day deleted");
      setDeleteOffDay(null);
      mutateShifts();
    } catch (err) {
      toast.error("Failed to delete off day");
    }
  };

  if (isStaffLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!staffProfile) return <div className="p-8 text-center text-red-500">Staff member not found</div>;

  const shiftFields = [
    { key: "date", label: "Date", required: true, type: "date" },
    { key: "start_time", label: "Start Time", type: "time" },
    { key: "end_time", label: "End Time", type: "time" },
    { key: "break_start", label: "Break Start", type: "time" },
    { key: "break_end", label: "Break End", type: "time" },
    { key: "break_duration_minutes", label: "Break Duration (mins)", type: "number", placeholder: "30" },
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
    { key: "progress_percentage", label: "Progress (%)", type: "number", placeholder: "0" },
  ];

  const shiftColumns = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time", render: (_, row) => row.start_time && row.end_time ? `${row.start_time.slice(0,5)} - ${row.end_time.slice(0,5)}` : (row.start_time ? `${row.start_time.slice(0,5)} - In Progress` : "—") },
    { key: "location", label: "Location", render: (_, row) => row.store_name ? (
      <div className="flex flex-col items-center text-center">
        <span className="font-semibold text-slate-800">{row.store_name}</span>
        {row.store_location && (
          row.store_map_link ? (
            <a href={row.store_map_link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5 flex items-center justify-center gap-1 w-fit transition-colors">
              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-center gap-1 w-fit">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
            </span>
          )
        )}
      </div>
    ) : <span className="text-slate-400 italic text-xs">Unassigned</span> },
    { key: "status", label: "Status", render: (v) => {
        if (v === 'IN_PROGRESS') return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-blue-100 text-blue-700 flex items-center w-fit gap-1.5 border border-blue-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>ACTIVE NOW</span>;
        if (v === 'DAY_OFF') return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-slate-100 text-slate-600 border border-slate-200">DAY OFF</span>;
        return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{v}</span>;
    }},
  ];

  const taskColumns = [
    { key: "title", label: "Title" },
    { key: "status", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full ${v === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
    { key: "progress_percentage", label: "Progress", render: (v) => `${v}%` },
    { key: "created_at", label: "Created", render: (v) => new Date(v).toLocaleDateString() },
  ];

  const offDayFields = [
    { key: "date", label: "Date", required: true, type: "date" },
  ];

  const offDayColumns = [
    { key: "date", label: "Date" },
    { key: "status", label: "Status", render: () => <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">DAY OFF</span> },
  ];

  const activeShift = shifts.find(s => s.status === 'IN_PROGRESS');

  return (
    <Container 
      title={`Staff: ${staffProfile.user?.name}`} 
      description={`${staffProfile.role} • ${staffProfile.store_name || "Unassigned"}`}
      actions={
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Staff
        </button>
      }
    >
      
      {/* Active Shift Banner */}
      {activeShift && (
        <div className="mb-6 bg-gradient-to-r from-[#00694C] to-[#004A3A] rounded-xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#009b72]/30 relative overflow-hidden gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
               <MapPin className="w-6 h-6 text-[#BCE4D3]" />
             </div>
             <div>
               <div className="text-[#BCE4D3] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                 CURRENTLY WORKING AT
               </div>
               <h3 className="text-xl font-serif font-bold text-white leading-tight">{activeShift.store_name || "Assigned Store"}</h3>
               {activeShift.store_map_link ? (
                 <a href={activeShift.store_map_link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/70 font-medium mt-0.5 hover:text-white hover:underline transition-colors block w-fit">
                   {activeShift.store_location || "Location not specified"}
                 </a>
               ) : (
                 <p className="text-[13px] text-white/70 font-medium mt-0.5">{activeShift.store_location || "Location not specified"}</p>
               )}
             </div>
          </div>
          <div className="relative z-10 sm:text-right bg-white/10 px-4 py-2.5 rounded-lg border border-white/10 backdrop-blur-sm w-full sm:w-auto flex sm:block justify-between items-center">
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">Checked In</div>
            <div className="text-lg font-bold font-mono text-white">{activeShift.start_time?.slice(0,5) || "--:--"}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 w-full">
        <button 
          onClick={() => setActiveTab("SHIFTS")}
          className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "SHIFTS" ? 'border-[#00694C] text-[#00694C]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Calendar size={16} /> Shifts
        </button>
        <button 
          onClick={() => setActiveTab("TASKS")}
          className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "TASKS" ? 'border-[#00694C] text-[#00694C]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <ClipboardList size={16} /> Tasks
        </button>
        <button 
          onClick={() => setActiveTab("OFF_DAYS")}
          className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "OFF_DAYS" ? 'border-[#00694C] text-[#00694C]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Ban size={16} /> Off Days
        </button>
      </div>

      <div className="w-full">
        
        {/* Shifts Section */}
        {activeTab === "SHIFTS" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-[#00694C]" /> Shift Schedule</h3>
              <button onClick={() => { setEditShift(null); setShiftOpen(true); }} className="text-xs bg-[#00694C] text-white px-3.5 py-1.5 rounded-md hover:bg-[#085041] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Plus size={14} /> Add Shift
              </button>
            </div>
            <div className="p-0">
              <DataTable 
                columns={shiftColumns} 
                data={shifts} 
                actions={(row) => (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditShift(row); setShiftOpen(true); }} className="db-icon-btn" title="Edit"><Edit size={14} /></button>
                    <button onClick={() => setDeleteShift(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Tasks Section */}
        {activeTab === "TASKS" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-[#00694C]" /> Assigned Tasks</h3>
              <button onClick={() => { setEditTask(null); setTaskOpen(true); }} className="text-xs bg-[#00694C] text-white px-3.5 py-1.5 rounded-md hover:bg-[#085041] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Plus size={14} /> Add Task
              </button>
            </div>
            <div className="p-0">
              <DataTable 
                columns={taskColumns} 
                data={tasks} 
                actions={(row) => (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditTask(row); setTaskOpen(true); }} className="db-icon-btn" title="Edit"><Edit size={14} /></button>
                    <button onClick={() => setDeleteTask(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Off Days Section */}
        {activeTab === "OFF_DAYS" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Ban size={18} className="text-red-500" /> Scheduled Off Days</h3>
              <button onClick={() => { setEditOffDay(null); setOffDayOpen(true); }} className="text-xs bg-[#00694C] text-white px-3.5 py-1.5 rounded-md hover:bg-[#085041] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Plus size={14} /> Add Off Day
              </button>
            </div>
            <div className="p-0">
              <DataTable 
                columns={offDayColumns} 
                data={offDays} 
                actions={(row) => (
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditOffDay(row); setOffDayOpen(true); }} className="db-icon-btn" title="Edit"><Edit size={14} /></button>
                    <button onClick={() => setDeleteOffDay(row)} className="db-icon-btn danger" title="Delete"><Trash2 size={14} /></button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

      </div>

      <Modal open={shiftOpen} onClose={() => { setShiftOpen(false); setEditShift(null); }} title={
        <div className="flex items-center gap-2.5 text-emerald-700">
          <Calendar size={18} className="text-emerald-500" />
          <span>{editShift ? "Edit Shift" : "Add Shift"}</span>
        </div>
      }>
        <FormModal fields={shiftFields} initialValues={editShift || {}} onSubmit={handleSaveShift} submitLabel={editShift ? "Update Shift" : "Save Shift"} />
      </Modal>

      <Modal open={taskOpen} onClose={() => { setTaskOpen(false); setEditTask(null); }} title={
        <div className="flex items-center gap-2.5 text-emerald-700">
          <ClipboardList size={18} className="text-emerald-500" />
          <span>{editTask ? "Edit Task" : "Add Task"}</span>
        </div>
      }>
        <FormModal fields={taskFields} initialValues={editTask || {}} onSubmit={handleSaveTask} submitLabel={editTask ? "Update Task" : "Save Task"} />
      </Modal>

      <Modal open={offDayOpen} onClose={() => { setOffDayOpen(false); setEditOffDay(null); }} title={
        <div className="flex items-center gap-2.5 text-emerald-700">
          <Ban size={18} className="text-emerald-500" />
          <span>{editOffDay ? "Edit Off Day" : "Add Off Day"}</span>
        </div>
      }>
        <FormModal fields={offDayFields} initialValues={editOffDay || {}} onSubmit={handleSaveOffDay} submitLabel={editOffDay ? "Update Off Day" : "Save Off Day"} />
      </Modal>

      <ConfirmDialog open={!!deleteShift} onClose={() => setDeleteShift(null)} onConfirm={handleDeleteShift} title="Delete Shift" message="Are you sure you want to delete this shift?" />
      <ConfirmDialog open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDeleteTask} title="Delete Task" message="Are you sure you want to delete this task?" />
      <ConfirmDialog open={!!deleteOffDay} onClose={() => setDeleteOffDay(null)} onConfirm={handleDeleteOffDay} title="Delete Off Day" message="Are you sure you want to delete this off day?" />

    </Container>
  );
}
