import React from 'react';
import { Calendar } from 'react-big-calendar';
import { FiCheck, FiX, FiEdit2 } from 'react-icons/fi';

const EditEventModal = ({
  isModalOpen,
  localizer,
  handleEventClick,
  handleSelectSlot,
  openModalFrom,
  handleSubmitEvent,
  eventDetails,
  handleEventDetailsChange,
  setOpenModalFrom,
  setIsModalOpen,
  setEditingEvent,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)'
        }}
      >
        {/* Dark mode gradient */}
        <div className="dark:block hidden absolute inset-0" style={{ 
          background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)'
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute w-64 h-64 rounded-full bg-[#9E2FD0]/10 blur-3xl -top-32 -left-32" />
          <div className="absolute w-64 h-64 rounded-full bg-[#F6B82E]/10 blur-3xl -bottom-32 -right-32" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#9E2FD0] to-[#F6B82E] bg-clip-text text-transparent dark:text-white">
              Edit Calendar
            </h2>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingEvent(false);
              }}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Calendar */}
          <div className="calendar-container rounded-xl overflow-hidden border border-gray-200 dark:border-[#9E2FD0]/20">
            <Calendar
              localizer={localizer}
              startAccessor="start"
              endAccessor="end"
              defaultView="week"
              step={60}
              timeslots={1}
              eventPropGetter={() => ({
                style: {
                  background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(158,47,208,0.3)',
                },
              })}
              formats={{
                eventTimeRangeFormat: () => '',
              }}
              onSelectEvent={handleEventClick}
              selectable
              onSelectSlot={handleSelectSlot}
              className="h-[500px]"
            />
          </div>

          {/* Edit Event Modal */}
          {openModalFrom && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
              <div 
                className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)'
                }}
              >
                {/* Dark mode gradient */}
                <div className="dark:block hidden absolute inset-0" style={{ 
                  background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)'
                }} />

                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <FiEdit2 className="text-[#9E2FD0]" size={20} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Edit Event
                    </h3>
                  </div>

                  <form onSubmit={handleSubmitEvent}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Time (HH:MM)
                        </label>
                        <input
                          type="text"
                          placeholder="09:00"
                          name="start"
                          value={eventDetails.start || ''}
                          onChange={handleEventDetailsChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Time (HH:MM)
                        </label>
                        <input
                          type="text"
                          placeholder="10:00"
                          name="end"
                          value={eventDetails.end || ''}
                          onChange={handleEventDetailsChange}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: 'linear-gradient(135deg, #26D9A1, #1fa07a)',
                          boxShadow: '0 4px 15px rgba(38,217,161,0.3)',
                        }}
                      >
                        <FiCheck className="inline mr-2" size={16} />
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenModalFrom(false)}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
                      >
                        <FiX className="inline mr-2" size={16} />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => {
              setIsModalOpen(false);
              setEditingEvent(false);
            }}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium flex items-center justify-center gap-2"
          >
            <FiX size={16} />
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;