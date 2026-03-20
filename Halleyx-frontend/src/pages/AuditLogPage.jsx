import { useState, useEffect } from 'react';
import { executionApi } from '../api/executionApi';

const statusConfig = {
  completed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  running: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  failed: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
  'awaiting approval': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  canceled: {
    bg: 'bg-surface-500/10',
    text: 'text-surface-400',
    border: 'border-surface-500/20',
    dot: 'bg-surface-400',
  },
};

const filters = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'running', label: 'Running' },
  { id: 'failed', label: 'Failed' },
  { id: 'awaiting approval', label: 'Awaiting Approval' },
  { id: 'canceled', label: 'Canceled' },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Audit logs are currently derived from executions or a separate endpoint
    // For now, we'll fetch executions and flatten their steps if available, or show a meaningful placeholder
    executionApi.getAllExecutions()
      .then(data => {
        // Mocking some audit logs based on execution data for now
        // In a real app, this would be a separate API call
        const mockLogs = data.flatMap(exec => [
          {
            id: `log-${exec.id}-1`,
            step: 'Process Order',
            type: 'ACTION',
            status: mapStatus(exec.status),
            duration: calculateDuration(exec.startedAt, exec.endedAt),
            time: formatDate(exec.startedAt),
            executionId: exec.id,
            executionName: exec.workflowName || 'Order Flow'
          }
        ]);
        setLogs(mockLogs);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = log.step.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.executionId.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Logs', value: logs.length, color: 'text-primary-400' },
    { label: 'Completed', value: logs.filter(l => l.status === 'completed').length, color: 'text-emerald-400' },
    { label: 'Failed', value: logs.filter(l => l.status === 'failed').length, color: 'text-red-400' },
    { label: 'Avg Duration', value: '1.2s', color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title text-3xl font-bold text-white">Audit Logs</h1>
        <p className="mt-2 text-surface-400">
          Complete execution history with rule evaluation details
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-6 border border-surface-800/50 relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className={`w-12 h-12 ${stat.color}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-surface-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search step name, execution ID, errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-900/50 border border-surface-800/50 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
          />
          <svg className="w-5 h-5 text-surface-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-surface-900/50 border border-surface-800/50 rounded-xl">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                filter === f.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card border border-surface-800/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-800/50 bg-surface-800/30">
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Step</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Execution</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                      <span className="text-surface-500 font-medium">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-32 text-center">
                    <p className="text-surface-500 text-lg font-medium">No audit logs yet. Execute a workflow to generate logs.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const config = statusConfig[log.status] || statusConfig.running;
                  return (
                    <tr key={log.id} className="hover:bg-primary-500/5 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-bold text-surface-100 group-hover:text-primary-400 transition-colors uppercase tracking-tight">{log.step}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono bg-surface-800/80 px-2 py-1 rounded text-surface-400 border border-surface-700/50">{log.type}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${config.bg} ${config.text} ${config.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-surface-400">{log.duration}</span>
                      </td>
                      <td className="px-6 py-5 text-surface-400">
                        {log.time}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-surface-300">{log.executionName}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 🔥 HELPERS (Reusing from ExecutionPage for consistency)

function mapStatus(status) {
  if (!status) return 'running';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'success') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  if (s === 'awaiting_approval' || s === 'pending') return 'awaiting approval';
  if (s === 'canceled' || s === 'cancelled') return 'canceled';
  return 'running';
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateDuration(start, end) {
  if (!start) return '—';
  const endTime = end ? new Date(end) : new Date();
  const diffInSeconds = Math.floor((endTime - new Date(start)) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const mins = Math.floor(diffInSeconds / 60);
  const secs = diffInSeconds % 60;
  return `${mins}m ${secs}s`;
}
