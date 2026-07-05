"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from "lucide-react";

export default function DatePickerModal({ isOpen, onClose, selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    } else if (isOpen) {
      setCurrentMonth(new Date());
    }
  }, [isOpen, selectedDate]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  // Day 0 is Sunday
  const startingDay = firstDayOfMonth; 
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format to YYYY-MM-DD local time correctly
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    onSelectDate(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const renderDays = () => {
    const days = [];
    const today = new Date();
    
    // Empty slots before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isToday = dateToCheck.toDateString() === today.toDateString();
      
      let isSelected = false;
      if (selectedDate) {
        const selDate = new Date(selectedDate);
        isSelected = dateToCheck.toDateString() === new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate()).toDateString();
      }

      days.push(
        <button
          key={i}
          onClick={() => handleDateClick(i)}
          className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer
            ${isSelected 
              ? 'bg-[#00694C] text-white shadow-md shadow-[#00694C]/30 scale-110' 
              : isToday 
                ? 'bg-emerald-50 text-[#00694C] border border-emerald-200 hover:bg-emerald-100'
                : 'text-slate-700 hover:bg-slate-100'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header Graphic Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#00694C] to-[#00896A] opacity-10" />
            
            <div className="p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00694C]/10 flex items-center justify-center text-[#00694C]">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">Choose Date</h3>
                    <p className="text-xs text-slate-500 font-medium">Select a date for the report</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar Controller */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-slate-800">
                    {monthNames[currentMonth.getMonth()]} <span className="text-slate-500 font-medium">{currentMonth.getFullYear()}</span>
                  </h4>
                  <div className="flex gap-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                  {renderDays()}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    onSelectDate("");
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    onSelectDate(`${yyyy}-${mm}-${dd}`);
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#00694C] text-white text-sm font-bold shadow-md shadow-[#00694C]/20 hover:bg-[#005940] transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
