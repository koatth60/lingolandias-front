import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

const LEVEL_STYLES = {
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warn:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  info:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

// Reduces a raw user-agent string to "OS · Browser" so it's scannable in a table cell —
// full string is still available via the title tooltip.
const summarizeUserAgent = (ua) => {
  if (!ua) return '—';
  let os = 'Unknown OS';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/EdgiOS|Edg\//.test(ua)) browser = 'Edge';
  else if (/CriOS|Chrome\//.test(ua)) browser = 'Chrome';
  else if (/FxiOS|Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Version\/.*Safari/.test(ua)) browser = 'Safari';

  return `${os} · ${browser}`;
};

const MeetingLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');
  const [level, setLevel] = useState('');

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (roomId) params.set('roomId', roomId);
    if (level) params.set('level', level);
    fetch(`${BACKEND_URL}/meeting-logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [email, roomId, level]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meeting Logs</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Diagnostic events reported by the Jitsi classroom (camera/mic errors, load timeouts, connection warnings)
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2FD0] w-56"
        />
        <input
          type="text"
          placeholder="Filter by room id..."
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2FD0] w-56"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]"
        >
          <option value="">All levels</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)' }}
        >
          Refresh
        </button>
        {(email || roomId || level) && (
          <button
            onClick={() => { setEmail(''); setRoomId(''); setLevel(''); }}
            className="px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-gray-700 transition"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#9E2FD0] border-t-transparent animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">No logs found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-brand-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-auto" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-brand-dark-secondary z-10">
              <tr className="text-left text-xs uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_STYLES[log.level] || LEVEL_STYLES.info}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">{log.event}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {log.userName || '—'}
                    <div className="text-xs text-gray-400">{log.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{log.role || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap" title={log.userAgent || ''}>
                    {summarizeUserAgent(log.userAgent)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[140px] truncate" title={log.roomId}>
                    {log.roomId || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[360px]">
                    <pre className="whitespace-pre-wrap break-words text-xs font-mono">{log.detail}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MeetingLogsPanel;
