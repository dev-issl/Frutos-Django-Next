"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, ClipboardList, Edit, Ban, MapPin, ChevronLeft, ChevronRight, ChevronDown, Store as StoreIcon, FileText, Download, Clock, CheckCircle, Printer, Eye } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import DatePickerModal from "@/app/dashboard/_components/DatePickerModal";
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
  const [shiftStartDate, setShiftStartDate] = useState("");
  const [shiftEndDate, setShiftEndDate] = useState("");
  const [shiftStoreName, setShiftStoreName] = useState("");
  const [pickerOpenFor, setPickerOpenFor] = useState(null); // "START" or "END"
  const [storeFilterOpen, setStoreFilterOpen] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [attendanceFilter, setAttendanceFilter] = useState("ALL");

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [reportMonth, setReportMonth] = useState(currentYearMonth);
  const [reportMonthPickerOpen, setReportMonthPickerOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(parseInt(currentYearMonth.split('-')[0]));

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

  const { data: storesRaw } = useSWR(
    "/api/stores/",
    (url) => api.get(url)
  );

  const allShifts = shiftsRaw?.results || (Array.isArray(shiftsRaw) ? shiftsRaw : []);
  const shifts = allShifts.filter(s => s.status !== 'DAY_OFF');
  const allStoresList = storesRaw?.results || (Array.isArray(storesRaw) ? storesRaw : []);

  const uniqueStores = useMemo(() => {
    const stores = shifts.map(s => s.store_name).filter(Boolean);
    return [...new Set(stores)].sort();
  }, [shifts]);

  const filteredShifts = shifts.filter(s => {
    if (shiftStartDate && s.date < shiftStartDate) return false;
    if (shiftEndDate && s.date > shiftEndDate) return false;
    if (shiftStoreName && s.store_name !== shiftStoreName) return false;
    return true;
  });

  const filteredAttendance = allShifts.filter(s => {
    if (attendanceFilter === "ALL") return true;
    if (attendanceFilter === "ABSENT") return s.status === 'ABSENT';
    if (attendanceFilter === "DAY_OFF") return s.status === 'DAY_OFF';
    if (attendanceFilter === "WORKED") return s.status !== 'ABSENT' && s.status !== 'DAY_OFF';
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const tasks = tasksRaw?.results || (Array.isArray(tasksRaw) ? tasksRaw : []);
  const filteredTasks = tasks.filter(t => taskStatusFilter === "ALL" || t.status === taskStatusFilter);

  const reportData = useMemo(() => {
    if (!allShifts) return { shifts: [], totalHours: 0, daysPresent: 0, daysAbsent: 0, daysOff: 0 };
    const monthShifts = allShifts.filter(s => s.date.startsWith(reportMonth));
    let totalMins = 0;
    let present = 0;
    let absent = 0;
    let off = 0;

    monthShifts.forEach(s => {
      if (s.status === 'ABSENT') absent++;
      else if (s.status === 'DAY_OFF') off++;
      else if (s.status === 'COMPLETED' || s.status === 'IN_PROGRESS') {
        present++;
        if (s.start_time && s.end_time) {
          const start = new Date(`1970-01-01T${s.start_time}`);
          let end = new Date(`1970-01-01T${s.end_time}`);
          if (end < start) end.setDate(end.getDate() + 1);
          let durationMins = (end - start) / 60000;
          if (s.break_duration_minutes) durationMins -= s.break_duration_minutes;
          totalMins += Math.max(0, durationMins);
        }
      }
    });
    
    return {
      shifts: monthShifts.sort((a, b) => new Date(a.date) - new Date(b.date)),
      totalHours: `${Math.floor(totalMins / 60)}h ${Math.round(totalMins % 60)}m`,
      daysPresent: present,
      daysAbsent: absent,
      daysOff: off
    };
  }, [allShifts, reportMonth]);

  const handlePrint = () => {
    setExportMenuOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadActualPDF = async () => {
    setExportMenuOpen(false);
    toast.success("Generating PDF. Please wait...");
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('monthly-report-container');
      if (!element) throw new Error("Report container not found");
      
      const editBtns = element.querySelectorAll('.report-edit-btn');
      editBtns.forEach(btn => btn.style.display = 'none');
      
      const tableWrapper = element.querySelector('.overflow-x-auto');
      let originalOverflow = '';
      if (tableWrapper) {
        originalOverflow = tableWrapper.style.overflow;
        tableWrapper.style.overflow = 'visible';
      }
      
      element.classList.add('pdf-mode');
      
      // html-to-image supports modern CSS via SVG foreignObject.
      const dataUrl = await toPng(element, { 
        quality: 0.98, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true
      });
      
      element.classList.remove('pdf-mode');
      if (tableWrapper) {
        tableWrapper.style.overflow = originalOverflow;
      }
      editBtns.forEach(btn => btn.style.display = ''); 
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Monthly_Report_${staffProfile?.user?.name}_${reportMonth}.pdf`);
      
      toast.success("PDF Downloaded successfully!");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleFullscreen = () => {
    setExportMenuOpen(false);
    const elem = document.getElementById("monthly-report-container");
    if (!elem) return;
    
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => toast.error("Could not enter fullscreen mode"));
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

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
      const payload = { ...values, staff: staffId };
      if (!payload.status) payload.status = 'DAY_OFF';
      if (editOffDay) {
        await api.patch(`/api/staff/admin/shifts/${editOffDay.id}/`, payload);
        toast.success("Record updated");
      } else {
        await api.post("/api/staff/admin/shifts/", payload);
        toast.success("Record added");
      }
      setOffDayOpen(false);
      setEditOffDay(null);
      mutateShifts();
    } catch (err) {
      toast.error(err?.message || "Failed to save record");
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
    {
      key: "status", label: "Status", type: "select", options: [
        { value: "SCHEDULED", label: "Scheduled" },
        { value: "DAY_OFF", label: "Day Off" },
        { value: "ABSENT", label: "Absent" },
      ]
    },
  ];

  const taskFields = [
    { key: "title", label: "Task Title", required: true, placeholder: "e.g. Package Organic Honey" },
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "status", label: "Status", type: "select", options: [
        { value: "PENDING", label: "Pending" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "COMPLETED", label: "Completed" },
      ]
    },
    { key: "progress_percentage", label: "Progress (%)", type: "number", placeholder: "0" },
  ];

  const shiftColumns = [
    { key: "date", label: "Date", render: (v) => <span className="font-medium text-slate-700">{formatDate(v)}</span> },
    {
      key: "time", label: "Time", render: (_, row) => {
        const isPastDate = new Date(row.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
        return row.start_time && row.end_time ? (
          <span className="font-medium text-slate-700">{formatTime(row.start_time)} - {formatTime(row.end_time)}</span>
        ) : (row.start_time ? (
          <span className={`font-medium ${isPastDate ? 'text-amber-600' : 'text-blue-600'}`}>{formatTime(row.start_time)} - {isPastDate ? 'Missing Out' : 'In Progress'}</span>
        ) : <span className="text-slate-400">—</span>)
      }
    },
    {
      key: "location", label: "Location", render: (_, row) => row.store_name ? (
        <div className="flex flex-col items-start text-left">
          <span className="font-semibold text-slate-800">{row.store_name}</span>
          {row.store_location && (
            row.store_map_link ? (
              <a href={row.store_map_link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5 flex items-center gap-1 w-fit transition-colors">
                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
              </a>
            ) : (
              <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 w-fit">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
              </span>
            )
          )}
        </div>
      ) : <span className="text-slate-400 italic text-xs">Unassigned</span>
    },
    {
      key: "status", label: "Status", render: (v, row) => {
        const isPastDate = new Date(row.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
        if (v === 'IN_PROGRESS') {
          if (isPastDate) return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-amber-100 text-amber-700 border border-amber-200">MISSING OUT</span>;
          return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-blue-100 text-blue-700 flex items-center w-fit gap-1.5 border border-blue-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>ACTIVE NOW</span>;
        }
        if (v === 'DAY_OFF') return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-slate-100 text-slate-600 border border-slate-200">DAY OFF</span>;
        return <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{v}</span>;
      }
    },
  ];

  const taskColumns = [
    { key: "title", label: "Title" },
    { key: "status", label: "Status", render: (v) => <span className={`px-2 py-0.5 text-xs rounded-full ${v === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
    { key: "progress_percentage", label: "Progress", render: (v) => `${v}%` },
    { key: "created_at", label: "Created", render: (v) => new Date(v).toLocaleDateString() },
  ];

  const offDayFields = [
    { key: "date", label: "Date", required: true, type: "date" },
    {
      key: "status", label: "Status", required: true, type: "select", options: [
        { value: "DAY_OFF", label: "Req. Off (Admin Approved)" },
        { value: "ABSENT", label: "Absent" },
      ]
    },
  ];

  const offDayColumns = [
    { key: "date", label: "Date", align: "left", render: (v) => <span className="font-semibold text-slate-700">{formatDate(v)}</span> },
    {
      key: "time", label: "Time", align: "left", render: (_, row) => {
        const isPastDate = new Date(row.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
        return row.start_time && row.end_time ? (
          <span className="font-medium text-slate-700 text-[13px]">{formatTime(row.start_time)} - {formatTime(row.end_time)}</span>
        ) : (row.start_time ? (
          <span className={`font-medium text-[13px] ${isPastDate ? 'text-amber-600' : 'text-blue-600'}`}>{formatTime(row.start_time)} - {isPastDate ? 'Missing Out' : 'In Progress'}</span>
        ) : <span className="text-slate-400">—</span>)
      }
    },
    {
      key: "location", label: "Store", align: "left", render: (_, row) => row.store_name ? (
        <div className="flex flex-col items-start">
          <span className="font-semibold text-slate-800 text-[13px]">{row.store_name}</span>
          {row.store_location && (
            row.store_map_link ? (
              <a href={row.store_map_link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5 flex items-center gap-1 w-fit transition-colors">
                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
              </a>
            ) : (
              <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 w-fit">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate max-w-[150px]">{row.store_location}</span>
              </span>
            )
          )}
        </div>
      ) : <span className="text-slate-400 italic text-xs">Unassigned</span>
    },
    {
      key: "status", label: "Status", align: "left", render: (v, row) => {
        const isPastDate = new Date(row.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
        if (row.status === 'ABSENT') {
          return <span className="inline-flex px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full bg-red-50 text-red-600 border border-red-200 shadow-sm">ABSENT</span>;
        }
        if (row.status === 'DAY_OFF') {
          return <span className="inline-flex px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full bg-orange-50 text-orange-600 border border-orange-200 shadow-sm">REQ. OFF (APPROVED)</span>;
        }
        if (row.status === 'IN_PROGRESS') {
          if (isPastDate) return <span className="inline-flex px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">MISSING OUT</span>;
        }
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>WORKED</span>;
      }
    },
  ];

  const activeShift = shifts.find(s => s.status === 'IN_PROGRESS' && new Date(s.date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0));

  return (
    <>
      <style>{`
        .pdf-header {
          display: none;
        }
        .pdf-mode .pdf-header {
          display: block !important;
        }
        .pdf-mode {
          background: white !important;
          color: black !important;
          padding: 30px !important;
        }
        .pdf-mode td {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
          font-size: 11px !important;
        }
        .pdf-mode th {
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
          font-size: 10px !important;
        }
        .pdf-mode .grid {
          gap: 10px !important;
          margin-bottom: 16px !important;
        }
        .pdf-mode .mb-5 {
          margin-bottom: 16px !important;
        }
        .pdf-stat-label {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          font-size: 8px !important;
          letter-spacing: 0.05em !important;
        }
        .pdf-stat-value {
          white-space: nowrap !important;
          overflow: visible !important;
          font-size: 16px !important;
          line-height: 1.2 !important;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #monthly-report-container, #monthly-report-container * {
            visibility: visible;
          }
          #monthly-report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .report-edit-btn {
            display: none !important;
          }
        }
      `}</style>
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
            <div className="text-lg font-bold font-mono text-white">{activeShift.start_time ? formatTime(activeShift.start_time) : "--:--"}</div>
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
          <Ban size={16} /> Attendance & Leaves
        </button>
        <button
          onClick={() => setActiveTab("REPORT")}
          className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "REPORT" ? 'border-[#00694C] text-[#00694C]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <FileText size={16} /> Monthly Report
        </button>
      </div>

      <div className="w-full">

        {/* Shifts Section */}
        {activeTab === "SHIFTS" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-[#00694C]" /> Shift Schedule</h3>
            </div>
            <div className="p-0">
              <DataTable
                columns={shiftColumns}
                data={filteredShifts}
                searchable={false}
                extraFilters={
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div
                        onClick={() => setStoreFilterOpen(!storeFilterOpen)}
                        className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-[#00694C]/50 transition-colors px-3 py-2 cursor-pointer w-[160px]"
                      >
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className={`text-xs font-medium truncate flex-1 ${shiftStoreName ? 'text-slate-700' : 'text-slate-400'}`}>
                          {shiftStoreName || "All Stores"}
                        </span>
                        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${storeFilterOpen ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {storeFilterOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setStoreFilterOpen(false)}></div>
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                            >
                              <button
                                onClick={() => { setShiftStoreName(""); setStoreFilterOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 ${!shiftStoreName ? 'text-[#00694C] bg-emerald-50/50' : 'text-slate-600'}`}
                              >
                                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <MapPin size={12} className="text-slate-400" />
                                </div>
                                All Stores
                              </button>
                              {uniqueStores.map(storeName => {
                                const storeObj = allStoresList.find(s => s.name === storeName);
                                return (
                                  <button
                                    key={storeName}
                                    onClick={() => { setShiftStoreName(storeName); setStoreFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2 ${shiftStoreName === storeName ? 'text-[#00694C] bg-emerald-50/50' : 'text-slate-600'}`}
                                  >
                                    <div className="w-6 h-6 rounded bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                                      {storeObj?.image ? (
                                        <img src={storeObj.image} alt={storeName} className="w-full h-full object-cover" />
                                      ) : (
                                        <StoreIcon size={12} className="text-slate-400" />
                                      )}
                                    </div>
                                    {storeName}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="relative flex items-center">
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:border-[#00694C]/50 transition-colors">
                        <div className="px-3 py-2 bg-slate-50 border-r border-slate-200 text-slate-400 flex items-center justify-center">
                          <Calendar size={14} />
                        </div>
                        <button
                          onClick={() => setPickerOpenFor("START")}
                          className={`px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer w-[100px] text-left transition-colors hover:bg-slate-50 ${shiftStartDate ? 'text-slate-700' : 'text-slate-400'}`}
                        >
                          {shiftStartDate ? formatDate(shiftStartDate) : "Start Date"}
                        </button>
                        <span className="text-slate-200 text-xs font-medium px-1">|</span>
                        <button
                          onClick={() => setPickerOpenFor("END")}
                          className={`px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer w-[100px] text-left transition-colors hover:bg-slate-50 ${shiftEndDate ? 'text-slate-700' : 'text-slate-400'}`}
                        >
                          {shiftEndDate ? formatDate(shiftEndDate) : "End Date"}
                        </button>
                      </div>
                      <DatePickerModal
                        isOpen={pickerOpenFor !== null}
                        onClose={() => setPickerOpenFor(null)}
                        selectedDate={pickerOpenFor === "START" ? shiftStartDate : shiftEndDate}
                        onSelectDate={(date) => {
                          if (pickerOpenFor === "START") setShiftStartDate(date);
                          else if (pickerOpenFor === "END") setShiftEndDate(date);
                        }}
                      />
                    </div>
                    {(shiftStartDate || shiftEndDate || shiftStoreName) && (
                      <button onClick={() => { setShiftStartDate(""); setShiftEndDate(""); setShiftStoreName(""); }} className="text-xs text-slate-500 hover:text-red-600 font-medium px-3 py-2 bg-white hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 shadow-sm flex items-center gap-1 cursor-pointer">
                        Clear
                      </button>
                    )}
                  </div>
                }
                actions={(row) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => { setEditShift(row); setShiftOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer" title="Edit">
                      <Edit size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setDeleteShift(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer" title="Delete">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
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
                data={filteredTasks}
                searchable={true}
                searchKeys={["title"]}
                extraFilters={
                  <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
                    {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setTaskStatusFilter(status)}
                        className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all tracking-wide cursor-pointer ${taskStatusFilter === status
                            ? 'bg-white text-[#00694C] shadow-sm border border-slate-100'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                          }`}
                      >
                        {status === 'ALL' ? 'ALL STATUS' : status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                }
                actions={(row) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => { setEditTask(row); setTaskOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer" title="Edit">
                      <Edit size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setDeleteTask(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer" title="Delete">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Attendance & Leaves Section */}
        {activeTab === "OFF_DAYS" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Ban size={18} className="text-[#00694C]" /> Attendance & Leaves</h3>
              <button onClick={() => { setEditOffDay(null); setOffDayOpen(true); }} className="text-xs bg-[#00694C] text-white px-3.5 py-1.5 rounded-md hover:bg-[#085041] font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Plus size={14} /> Add Record
              </button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Filter by:</span>
              {[
                { id: "ALL", label: "All Records" },
                { id: "WORKED", label: "Worked" },
                { id: "ABSENT", label: "Absent" },
                { id: "DAY_OFF", label: "Req. Off (Approved)" },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setAttendanceFilter(filter.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all tracking-wide cursor-pointer border shadow-sm ${attendanceFilter === filter.id
                      ? 'bg-white text-[#00694C] border-slate-200 ring-1 ring-slate-100'
                      : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50 hover:text-slate-700'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="p-0">
              <DataTable
                columns={offDayColumns}
                data={filteredAttendance}
                searchable={false}
                actions={(row) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => { setEditOffDay(row); setOffDayOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer" title="Edit">
                      <Edit size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setDeleteOffDay(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer" title="Delete">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Monthly Report Section */}
        {activeTab === "REPORT" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-[#00694C]" /> Monthly Report</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={() => {
                      setPickerYear(parseInt(reportMonth.split('-')[0]));
                      setReportMonthPickerOpen(!reportMonthPickerOpen);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-[#00694C]/50 transition-all shadow-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 cursor-pointer"
                  >
                    <Calendar size={16} className="text-[#00694C]" />
                    {new Date(reportMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${reportMonthPickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {reportMonthPickerOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setReportMonthPickerOpen(false)}></div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-2 w-[240px] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5"
                        >
                          <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                            <button 
                              onClick={() => setPickerYear(y => y - 1)} 
                              className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-[#00694C] hover:bg-emerald-50 transition-colors shadow-sm border border-slate-200 hover:border-emerald-200 cursor-pointer"
                            >
                              <ChevronLeft size={16} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-slate-700 tracking-wide text-[15px]">{pickerYear}</span>
                            <button 
                              onClick={() => setPickerYear(y => y + 1)} 
                              className="p-1.5 bg-white rounded-lg text-slate-500 hover:text-[#00694C] hover:bg-emerald-50 transition-colors shadow-sm border border-slate-200 hover:border-emerald-200 cursor-pointer"
                            >
                              <ChevronRight size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 p-3">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                              const monthStr = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                              const isSelected = reportMonth === monthStr;
                              return (
                                <button
                                  key={m}
                                  onClick={() => {
                                    setReportMonth(monthStr);
                                    setReportMonthPickerOpen(false);
                                  }}
                                  className={`py-2 text-xs font-bold rounded-xl transition-all tracking-wide cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#00694C] text-white shadow-md shadow-[#00694C]/30' 
                                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200'
                                  }`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setExportMenuOpen(!exportMenuOpen)} 
                    className="text-xs bg-[#00694C] text-white px-4 py-2 rounded-lg hover:bg-[#085041] font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00694C]/20"
                  >
                    Export <ChevronDown size={14} className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {exportMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)}></div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 flex flex-col py-1.5"
                        >
                          <button onClick={handlePrint} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00694C] transition-colors cursor-pointer w-full text-left">
                            <Printer size={16} className="text-slate-400" />
                            Print Report
                          </button>
                          <button onClick={handleDownloadActualPDF} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00694C] transition-colors cursor-pointer w-full text-left">
                            <Download size={16} className="text-slate-400" />
                            Download as PDF
                          </button>
                          <button onClick={handleFullscreen} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00694C] transition-colors cursor-pointer w-full text-left">
                            <Eye size={16} className="text-slate-400" />
                            View Fullscreen
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            <div id="monthly-report-container" className="p-6 sm:p-8 bg-white md:bg-slate-50/30">
              
              {/* PDF Only Company Header */}
              <div className="pdf-header border-b border-slate-200 pb-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-black text-[#00694C] tracking-tight">EL ARBOL</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Premium Fruits & Organic Produce</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-medium leading-relaxed">
                    <p>Road 12/A, Dhanmondi, Dhaka</p>
                    <p>info@elarbol.com | +880 123456789</p>
                    <p className="text-[#00694C] font-bold mt-1">Report Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Report Header Card */}
              <div className="mb-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-[#00694C]/10 rounded-lg flex items-center justify-center border border-[#00694C]/15 shrink-0">
                    <FileText className="w-5 h-5 text-[#00694C]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">{staffProfile?.user?.name}</h2>
                      <span className="bg-[#00694C]/10 text-[#00694C] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">{staffProfile?.role}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-medium mt-0.5 flex items-center gap-1.5">
                      <MapPin size={10} className="shrink-0" />
                      {staffProfile?.store_name || 'Unassigned'}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-semibold">{new Date(reportMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Report</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Stat Cards — compact horizontal strip */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <CheckCircle size={14} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="pdf-stat-label text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Days Present</div>
                    <div className="pdf-stat-value text-lg font-black text-slate-800 leading-tight whitespace-nowrap">{reportData.daysPresent}</div>
                  </div>
                </div>

                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <Clock size={14} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="pdf-stat-label text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Total Hours</div>
                    <div className="pdf-stat-value text-lg font-black text-slate-800 leading-tight whitespace-nowrap">{reportData.totalHours}</div>
                  </div>
                </div>

                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
                    <Ban size={14} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="pdf-stat-label text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Days Absent</div>
                    <div className="pdf-stat-value text-lg font-black text-red-600 leading-tight whitespace-nowrap">{reportData.daysAbsent}</div>
                  </div>
                </div>

                <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                    <Calendar size={14} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="pdf-stat-label text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Days Off</div>
                    <div className="pdf-stat-value text-lg font-black text-orange-600 leading-tight whitespace-nowrap">{reportData.daysOff}</div>
                  </div>
                </div>
              </div>
              
              {/* Shift Log Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" /> Shift Log
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest w-[20%]">Date</th>
                        <th className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest w-[20%]">Status</th>
                        <th className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest w-[25%]">Time</th>
                        <th className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest w-[25%]">Store</th>
                        <th className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest text-right report-edit-btn w-[10%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.shifts.length === 0 ? (
                        <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No records found for this month</td></tr>
                      ) : (
                        reportData.shifts.map(shift => (
                          <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-2.5 px-6 font-semibold text-slate-700 text-sm">{formatDate(shift.date)}</td>
                            <td className="py-2.5 px-6">
                              {shift.status === 'ABSENT' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-md bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">ABSENT</span>
                              ) : shift.status === 'DAY_OFF' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-md bg-orange-50 text-orange-600 border border-orange-200 whitespace-nowrap">DAY OFF</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 whitespace-nowrap">PRESENT</span>
                              )}
                            </td>
                            <td className="py-2.5 px-6 text-slate-600 font-medium text-sm">
                              {shift.start_time ? `${formatTime(shift.start_time)} - ${shift.end_time ? formatTime(shift.end_time) : '?'}` : '—'}
                            </td>
                            <td className="py-2.5 px-6 text-slate-600 font-medium text-sm">
                              {shift.store_name ? (
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={13} className="text-slate-400" />
                                  <span className="truncate">{shift.store_name}</span>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="py-2.5 px-6 text-right report-edit-btn">
                              <button 
                                onClick={() => {
                                  if (shift.status === 'ABSENT' || shift.status === 'DAY_OFF') {
                                    setEditOffDay(shift); setOffDayOpen(true);
                                  } else {
                                    setEditShift(shift); setShiftOpen(true);
                                  }
                                }} 
                                className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-[#00694C] hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100" 
                                title="Edit Record"
                              >
                                <Edit size={14} strokeWidth={2.5} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
          <span>{editOffDay ? "Edit Record" : "Add Record"}</span>
        </div>
      }>
        <FormModal fields={offDayFields} initialValues={editOffDay || {}} onSubmit={handleSaveOffDay} submitLabel={editOffDay ? "Update Record" : "Save Record"} />
      </Modal>

      <ConfirmDialog open={!!deleteShift} onClose={() => setDeleteShift(null)} onConfirm={handleDeleteShift} title="Delete Shift" message="Are you sure you want to delete this shift?" />
      <ConfirmDialog open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDeleteTask} title="Delete Task" message="Are you sure you want to delete this task?" />
      <ConfirmDialog open={!!deleteOffDay} onClose={() => setDeleteOffDay(null)} onConfirm={handleDeleteOffDay} title="Delete Record" message="Are you sure you want to delete this attendance record?" />

    </Container>
    </>
  );
}
