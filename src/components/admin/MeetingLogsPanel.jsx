import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

const LEVEL_STYLES = {
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  warn:  'bg-ll-gold-tint text-ll-gold-ink',
  info:  'bg-ll-hover text-ll-ink2',
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

  const levelPill = (log) => (
    <span className={`inline-flex h-5 items-center px-2 rounded-full text-[11.5px] font-medium ${LEVEL_STYLES[log.level] || LEVEL_STYLES.info}`}>
      {log.level}
    </span>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">Meeting Logs</h1>
        <p className="text-ll-ink3 mt-1 text-[13.5px]">
          Diagnostic events reported by the Jitsi classroom (camera/mic errors, load timeouts, connection warnings)
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <input type="text" placeholder="Filter by email..." value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 px-3 rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink text-[13.5px] placeholder:text-ll-ink3 focus:outline-none focus:border-ll-violet/60 w-full sm:w-56" />
        <input type="text" placeholder="Filter by room id..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className="h-9 px-3 rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink text-[13.5px] placeholder:text-ll-ink3 focus:outline-none focus:border-ll-violet/60 w-full sm:w-56" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 px-3 rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink text-[13.5px] placeholder:text-ll-ink3 focus:outline-none focus:border-ll-violet/60">
          <option value="">All levels</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
        </select>
        <button onClick={fetchLogs} className="ll-btn ll-btn-primary">Refresh</button>
        {(email || roomId || level) && (
          <button onClick={() => { setEmail(''); setRoomId(''); setLevel(''); }} className="ll-btn ll-btn-secondary">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-[3px] border-ll-violet/30 border-t-ll-violet animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[14px] font-semibold text-ll-ink">No logs found</p>
          <p className="text-[13px] text-ll-ink3 mt-1">Try a different filter.</p>
        </div>
      ) : (
        <>
          {/* Phone: one card per event, no sideways scrolling */}
          <div className="md:hidden rounded-xl border border-ll-line divide-y divide-ll-line overflow-hidden">
            {logs.map((log) => (
              <div key={log.id} className="px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-medium text-ll-ink break-all">{log.event}</span>
                  {levelPill(log)}
                </div>
                <p className="font-mono text-[11.5px] text-ll-ink3 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                <p className="text-[12.5px] text-ll-ink2 mt-1.5">
                  {log.userName || '—'}{log.role ? ` · ${log.role}` : ''} · {summarizeUserAgent(log.userAgent)}
                </p>
                {log.roomId && <p className="font-mono text-[11.5px] text-ll-ink3 truncate">{log.roomId}</p>}
                {log.detail && log.detail !== '{}' && (
                  <pre className="mt-1.5 whitespace-pre-wrap break-words text-[11.5px] font-mono text-ll-ink3 bg-ll-subtle rounded-md px-2 py-1.5 max-h-24 overflow-auto">{log.detail}</pre>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block rounded-xl border border-ll-line overflow-auto bg-ll-panel" style={{ maxHeight: '70vh' }}>
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-ll-subtle z-10">
                <tr className="text-left text-[12px] text-ll-ink3 border-b border-ll-line">
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Level</th>
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Device</th>
                  <th className="px-4 py-2.5 font-medium">Room</th>
                  <th className="px-4 py-2.5 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-ll-line last:border-0 align-top hover:bg-ll-subtle">
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[12px] text-ll-ink3">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">{levelPill(log)}</td>
                    <td className="px-4 py-2.5 font-medium text-ll-ink whitespace-nowrap">{log.event}</td>
                    <td className="px-4 py-2.5 text-ll-ink2">
                      {log.userName || '—'}
                      <div className="text-[12px] text-ll-ink3">{log.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-ll-ink3">{log.role || '—'}</td>
                    <td className="px-4 py-2.5 text-ll-ink3 whitespace-nowrap" title={log.userAgent || ''}>
                      {summarizeUserAgent(log.userAgent)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-ll-ink3 max-w-[140px] truncate" title={log.roomId}>
                      {log.roomId || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-ll-ink3 max-w-[360px]">
                      <pre className="whitespace-pre-wrap break-words text-[11.5px] font-mono">{log.detail}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MeetingLogsPanel;
