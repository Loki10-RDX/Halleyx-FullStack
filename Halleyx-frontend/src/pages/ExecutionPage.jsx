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
  { id: 'running', label: 'Running' },
  { id: 'awaiting approval', label: 'Awaiting Approval' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'canceled', label: 'Canceled' },
];

export default function ExecutionPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    executionApi.getAllExecutions()
      .then(data => {
        const mapped = data.map(exec => ({
          id: exec.id,
          workflowName: exec.workflowName || exec.workflowId || 'Unknown Workflow',
          status: mapStatus(exec.status),
          currentStep: exec.currentStepName || 'Step 1',
          startedAt: formatDate(exec.startedAt),
          duration: calculateDuration(exec.startedAt, exec.endedAt),
          retries: exec.retryCount || 0,
        }));
        setExecutions(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all'
    ? executions
    : executions.filter(e => e.status === filter);

  const stats = [
    { label: 'Total', value: executions.length, color: 'text-primary-400' },
    { label: 'Completed', value: executions.filter(e => e.status === 'completed').length, color: 'text-emerald-400' },
    { label: 'Running', value: executions.filter(e => e.status === 'running').length, color: 'text-blue-400' },
    { label: 'Awaiting', value: executions.filter(e => e.status === 'awaiting approval').length, color: 'text-amber-400' },
    { label: 'Failed', value: executions.filter(e => e.status === 'failed').length, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Executions</h1>
          <p className="mt-2 text-surface-400">
            Monitor workflow execution history and results
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 border border-surface-800/50 hover:border-surface-700/50 transition-colors">
            <p className="text-sm font-medium text-surface-400">{stat.label}</p>
            <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-surface-900/50 p-1 rounded-xl w-fit border border-surface-800/50">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card border border-surface-800/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-800/50 bg-surface-800/20">
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Workflow</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Started</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Retries</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-surface-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                      Loading executions...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-surface-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </div>
                      <p className="text-surface-400 font-medium">No executions yet. Run a workflow to get started!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((execution) => {
                  const config = statusConfig[execution.status] || statusConfig.running;

                  return (
                    <tr key={execution.id} className="hover:bg-surface-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-surface-100 group-hover:text-primary-400 transition-colors">{execution.workflowName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {execution.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-300">{execution.startedAt}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-surface-300 font-mono">{execution.duration}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-surface-400 bg-surface-800/50 px-2 py-1 rounded">{execution.retries}</span>
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

// 🔥 HELPERS

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