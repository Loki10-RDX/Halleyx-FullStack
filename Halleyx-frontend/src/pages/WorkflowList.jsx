import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { workflowApi } from '../api/workflowApi';
import { executionApi } from '../api/executionApi';
import { stepApi } from '../api/stepApi';
import { ruleApi } from '../api/ruleApi';
import { evaluateCondition } from '../utils/ruleEngine';
import { runWorkflow } from '../utils/workflowEngine';

const statusStyles = {
  active: 'status-active',
  inactive: 'status-inactive',
};

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');
  const [errorType, setErrorType] = useState('error');
  const [selectedWorkflowVersions, setSelectedWorkflowVersions] = useState([]);
  
  const [showExecuteConfigModal, setShowExecuteConfigModal] = useState(false);
  const [executingWorkflow, setExecutingWorkflow] = useState(null);
  const [executeFormData, setExecuteFormData] = useState({});
  const [executeSchema, setExecuteSchema] = useState(null);
  const [workflowRules, setWorkflowRules] = useState([]);
  const [executionRuleError, setExecutionRuleError] = useState('');
  const [executionSteps, setExecutionSteps] = useState([]);
  const [executionPath, setExecutionPath] = useState([]);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphStepIndex, setGraphStepIndex] = useState(0);

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (workflow) => {
    setSelectedWorkflow(workflow);
    setShowDeleteModal(true);
    setDeleteOption(null);
    try {
      const versions = await workflowApi.getWorkflowVersions(workflow.name);
      setSelectedWorkflowVersions(versions);

      // If only one version, auto-select option 1 for simplicity in logic,
      // though the UI will render it differently.
      if (versions.length === 1) {
        setDeleteOption(1);
      }
    } catch (e) {
      console.error('Failed to fetch workflow versions for delete modal', e);
      setSelectedWorkflowVersions([workflow]); // Fallback to current
    }
  };
  const toggleExpand = (name) => {
    setExpanded(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const fetchWorkflowRules = async (steps) => {
    try {
      const rulesByStep = await Promise.all(
        steps.map(step => ruleApi.getRules(step.id).catch(() => []))
      );
      return rulesByStep.flat();
    } catch (err) {
      console.error('Failed to load workflow rules:', err);
      return [];
    }
  };

  const doesInputMatchRules = (formData) => {
    if (!executeSchema || workflowRules.length === 0) {
      return true;
    }

    // Only check rules that mention amount (user request scenario)
    const amountRules = workflowRules.filter(r => /amount/i.test(r.condition));
    if (amountRules.length === 0) {
      return true;
    }

    // Evaluate at least one matching rule; if none match, do not allow execution.
    return amountRules.some(rule => evaluateCondition(rule.condition, formData));
  };

  const groupedWorkflows = workflows.reduce((acc, wf) => {
    if (!acc[wf.name]) {
      acc[wf.name] = [];
    }
    acc[wf.name].push(wf);
    return acc;
  }, {});
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await workflowApi.getWorkflows({
        search: searchQuery,
        page,
        size: 10
      });
      const activeOnly = data.content.filter(w => w.isActive);

      setWorkflows(activeOnly);
      setTotalElements(activeOnly.length);
      setTotalPages(Math.ceil(activeOnly.length / 10));
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };
  Object.keys(groupedWorkflows).forEach(name => {
    groupedWorkflows[name].sort((a, b) => b.version - a.version);
  });
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWorkflows();
    }, 300); // debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, page]);

  const handleExecute = async (workflow) => {
    try {
      // reset prior execution validation state
      setExecutionRuleError('');

      // 1. Check if workflow has configured steps
      const steps = await stepApi.getSteps(workflow.id);
      if (!steps || steps.length === 0) {
        setErrorMessage("This workflow has no steps configured. Please add steps using the 'Manage Steps' action before executing.");
        setErrorTitle("Cannot Execute");
        setErrorType("error");
        setShowErrorModal(true);
        return;
      }

      // load existing rules for workflow steps
      const rules = await fetchWorkflowRules(steps);
      setWorkflowRules(rules);

      if (!rules || rules.length === 0) {
        setErrorMessage("This workflow has no rules configured. Please add rules using the 'Manage Rules' action before executing.");
        setErrorTitle("Cannot Execute");
        setErrorType("error");
        setShowErrorModal(true);
        return;
      }

      setExecutionSteps(steps);
      setExecutionPath([]);
      setShowGraphModal(false);

      // 2. Parse schema
      let schemaObj = {};
      if (workflow.inputSchema) {
        try {
          schemaObj = typeof workflow.inputSchema === 'string' 
            ? JSON.parse(workflow.inputSchema) 
            : workflow.inputSchema;
        } catch (e) {
          console.error("Failed to parse schema", e);
        }
      }

      // 3. Initialize form data based on schema
      const initialData = {};
      Object.keys(schemaObj).forEach(key => {
        initialData[key] = '';
      });

      setExecuteSchema(schemaObj);
      setExecuteFormData(initialData);
      setExecutingWorkflow(workflow);
      setShowExecuteConfigModal(true);

    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load execution configuration. Please try again.");
      setErrorTitle("Execution Error");
      setErrorType("error");
      setShowErrorModal(true);
    }
  };

  const submitExecution = async (e) => {
    e.preventDefault();

    if (!doesInputMatchRules(executeFormData)) {
      setExecutionRuleError('Input value for amount does not match any rule condition. Adjust your input or workflow rules before executing.');
      return;
    }

    try {
      setShowExecuteConfigModal(false);
      const res = await executionApi.startWorkflow(executingWorkflow.id, executeFormData);

      console.log("Execution started:", res);

      const path = runWorkflow(
        executionSteps?.[0]?.id || null,
        executionSteps,
        workflowRules,
        executeFormData
      );
      setExecutionPath(path || []);
      setGraphStepIndex(path && path.length > 0 ? path.length - 1 : 0);

      setErrorMessage("Execution started successfully! 🚀");
      setErrorTitle("Success");
      setErrorType("success");
      setShowErrorModal(true);
      setExecutingWorkflow(null);
    } catch (err) {
      console.error(err);
      
      setErrorMessage(err.response?.data?.message || "Failed to start execution. Please verify your input and try again.");
      setErrorTitle("Execution Failed");
      setErrorType("error");
      setShowErrorModal(true);
      setExecutingWorkflow(null);
    }
  };

  const executeDisabled = !doesInputMatchRules(executeFormData);
  const orderedExecutionSteps = (executionSteps || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Workflows</h1>
          <p className="mt-2 text-surface-400">Manage and monitor your automation workflows</p>
        </div>
        <Link to="/workflows/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Workflow
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="input-field pl-12"
        />
      </div>

      {/* Workflow Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-700/50 bg-surface-800/20">
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Version</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-surface-400">Loading workflows...</td>
                </tr>
              ) : filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-surface-400">
                    No workflows found.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((workflow, index) =>

                (
                  <tr
                    key={workflow.id}
                    className="hover:bg-surface-800/30 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {workflow.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300 font-mono">
                      v{workflow.version}
                    </td>
                    <td className="px-6 py-4">
                      <span className={workflow.isActive ? statusStyles.active : statusStyles.inactive}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-400">
                      {new Date(workflow.updatedAt).toLocaleDateString()} {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-4">

                      {/* Edit */}
                      <Link
                        to={`/workflows/${workflow.id}`}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit Workflow"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M16.862 4.487a2.25 2.25 0 113.182 3.182L8.25 19.463 4.5 20.25l.787-3.75L16.862 4.487z" />
                        </svg>
                      </Link>

                      {/* Steps */}
                      <Link
                        to={`/workflows/${workflow.id}/steps`}
                        className="text-purple-400 hover:text-purple-300"
                        title="Manage Steps"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </Link>

                      {/* Rules */}
                      <Link
                        to={`/workflows/${workflow.id}/rules`}
                        className="text-amber-400 hover:text-amber-300"
                        title="Manage Rules"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h4M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M15 7h2a2 2 0 012 2v3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l1.5 1.5 3-3M7 15l1.5 1.5 3-3M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M17 14v-1 M17 21v-1 M14 17h-1 M21 17h-1 M14.879 14.879l-.707-.707 M19.121 19.121l.707.707 M14.879 19.121l-.707.707 M19.121 14.879l.707-.707" />
                        </svg>
                      </Link>

                      {/* Execute */}
                      <button
                        onClick={() => handleExecute(workflow)}
                        className="text-green-400 hover:text-green-300"
                        title="Execute Workflow"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 3l14 9-14 9V3z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(workflow)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Workflow"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M6 7h12M9 7v12m6-12v12M10 4h4m-7 3h10l-1 13H8L7 7z" />
                        </svg>
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-700/50 flex items-center justify-between">
            <span className="text-sm text-surface-400">
              Showing {workflows.length === 0 ? 0 : page * 10 + 1}
              to {Math.min((page + 1) * 10, totalElements)}
              of {filteredWorkflows.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-surface-700/50 text-surface-300 rounded hover:bg-surface-600 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-surface-700/50 text-surface-300 rounded hover:bg-surface-600 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl max-w-lg w-full shadow-2xl">
            {/* Icon and Title */}
            <div className="relative pt-8 px-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Delete Workflow</h2>
              <p className="text-slate-400 text-sm mb-4">{selectedWorkflow.name}</p>
              <p className="text-slate-300 text-sm mb-6">Choose what you want to delete. This action cannot be undone.</p>
            </div>

            {/* Options */}
            <div className="px-8 py-6 space-y-3 border-t border-slate-700/30">
              {selectedWorkflowVersions.length > 1 ? (
                <>
                  {/* Option 1: Delete Current Version */}
                  <button
                    onClick={() => setDeleteOption(1)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${deleteOption === 1
                        ? 'border-slate-500 bg-slate-800/60 shadow-lg'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/60 hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${deleteOption === 1
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-slate-600'
                        }`}>
                        {deleteOption === 1 && (
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">Delete Current Version</h3>
                        <p className="text-slate-400 text-xs mb-2">Remove only version {selectedWorkflow.version} of this workflow</p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">v{selectedWorkflow.version}</span>
                          {selectedWorkflow.isActive && (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded font-medium">Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Delete All Versions */}
                  <button
                    onClick={() => setDeleteOption(2)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${deleteOption === 2
                        ? 'border-slate-500 bg-slate-800/60 shadow-lg'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/60 hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${deleteOption === 2
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-slate-600'
                        }`}>
                        {deleteOption === 2 && (
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">Delete Entire Workflow</h3>
                        <p className="text-slate-400 text-xs mb-2">Remove all versions and data for this workflow permanently</p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2 py-1 bg-red-600/30 text-red-300 text-xs rounded font-medium">⚠ Destructive Action</span>
                          <span className="inline-block px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">All versions</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                <div className="w-full p-4 rounded-lg border border-red-500/50 bg-red-900/10 shadow-lg text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-400">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">Delete Workflow</h3>
                      <p className="text-slate-400 text-xs mb-2">This is the only version of this workflow. Deleting it will permanently remove the entire workflow and all its data.</p>
                      <div className="flex gap-2">
                        <span className="inline-block px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">v{selectedWorkflow.version}</span>
                        {selectedWorkflow.isActive && (
                          <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded font-medium">Active</span>
                        )}
                        <span className="inline-block px-2 py-1 bg-red-600/30 text-red-300 text-xs rounded font-medium">Destructive Action</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-700/30 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOption(null);
                  setSelectedWorkflow(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteOption || !selectedWorkflow) return;

                  try {
                    if (deleteOption === 1) {
                      // Delete current version
                      await workflowApi.deleteWorkflow(selectedWorkflow.id);
                    } else if (deleteOption === 2) {
                      // Delete all versions
                      await workflowApi.deleteWorkflowByName(selectedWorkflow.name);
                    }
                    setShowDeleteModal(false);
                    setDeleteOption(null);
                    setSelectedWorkflow(null);
                    fetchWorkflows();
                  } catch (err) {
                    console.error("Delete failed:", err);
                    setErrorMessage("Failed to delete workflow. Please try again.");
                    setErrorTitle("Delete Failed");
                    setErrorType("error");
                    setShowErrorModal(true);
                  }
                }}
                disabled={!deleteOption}
                className="flex-1 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 disabled:bg-red-600/40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error / Success Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="relative pt-8 px-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${errorType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    {errorType === 'success' ? (
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{errorTitle}</h2>
              <p className="text-slate-400 text-sm mb-8">{errorMessage}</p>
            </div>

            <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-700/30 flex gap-3">
              {errorType === 'success' && executionPath.length > 0 && (
                <button
                  onClick={() => {
                    setShowGraphModal(true);
                    setShowErrorModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all"
                >
                  Visualize Graph
                </button>
              )}

              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all"
              >
                {errorType === 'success' ? 'Continue' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Config Modal */}
      {showExecuteConfigModal && executingWorkflow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="px-8 pt-8 pb-6 border-b border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-2">Execute Workflow</h2>
              <p className="text-slate-400 text-sm">Provide the required input parameters for <span className="text-primary-400 font-semibold">{executingWorkflow.name}</span></p>
            </div>

            <form onSubmit={submitExecution}>
              <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh]">
                {Object.keys(executeSchema || {}).length === 0 ? (
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400 text-sm">This workflow does not require any input parameters.</p>
                  </div>
                ) : (
                  Object.entries(executeSchema).map(([key, fieldDetails]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-surface-300 mb-2">
                        {key.charAt(0).toUpperCase() + key.slice(1)} {fieldDetails.required && <span className="text-red-400">*</span>}
                      </label>
                      {fieldDetails.allowed_values ? (
                        <select
                          value={executeFormData[key]}
                          onChange={(e) => {
                            setExecutionRuleError('');
                            setExecuteFormData({ ...executeFormData, [key]: e.target.value });
                          }}
                          className="input-field"
                          required={fieldDetails.required}
                        >
                          <option value="" disabled hidden>Select {key}</option>
                          {fieldDetails.allowed_values.map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldDetails.type === 'number' ? 'number' : 'text'}
                          value={executeFormData[key] !== undefined ? executeFormData[key] : ''}
                          onChange={(e) => {
                            setExecutionRuleError('');
                            setExecuteFormData({ 
                              ...executeFormData, 
                              [key]: fieldDetails.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value 
                            });
                          }}
                          placeholder={`Enter ${key}...`}
                          className="input-field"
                          required={fieldDetails.required}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {executionRuleError && (
                <div className="px-8 pb-2">
                  <p className="text-red-400 text-sm">{executionRuleError}</p>
                </div>
              )}

              <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-700/30 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExecuteConfigModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executeDisabled}
                  className={`flex-1 px-4 py-2.5 ${executeDisabled ? 'bg-primary-500/40 cursor-not-allowed' : 'bg-primary-600/90 hover:bg-primary-500'} text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20`}
                >
                  Start Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGraphModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="px-8 pt-8 pb-6 border-b border-slate-700/50">
              <h2 className="text-2xl font-bold text-white mb-2">Execution Graph</h2>
              <p className="text-slate-400 text-sm">Visual path for workflow: <span className="text-primary-400 font-semibold">{executingWorkflow?.name}</span></p>
            </div>
            <div className="p-8">
              {executionPath.length === 0 ? (
                <p className="text-slate-300 text-sm">No steps were resolved during execution.</p>
              ) : orderedExecutionSteps.length === 0 ? (
                <p className="text-slate-300 text-sm">No steps available to visualize.</p>
              ) : (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {orderedExecutionSteps.map((step, index) => {
                    const executed = executionPath.includes(step.name);
                    const current = index === graphStepIndex;
                    return (
                      <>
                        <div
                          key={`step-${step.id || index}`}
                          className={`min-w-[120px] px-3 py-2 rounded-lg text-sm font-medium text-center border ${current ? 'ring-2 ring-cyan-400' : ''} ${executed ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-surface-200 border-slate-700'}`}
                        >
                          <div className="text-xs text-slate-400 mb-1">#{step.order}</div>
                          <div>{step.name}</div>
                        </div>
                        {index < orderedExecutionSteps.length - 1 && (
                          <span className="text-slate-400 text-xl select-none">→</span>
                        )}
                      </>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-700/30 flex justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setGraphStepIndex((i) => Math.max(0, i - 1))}
                  disabled={graphStepIndex === 0}
                  className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev Step
                </button>
                <button
                  onClick={() => setGraphStepIndex((i) => Math.min(executionPath.length - 1, i + 1))}
                  disabled={graphStepIndex >= executionPath.length - 1}
                  className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowGraphModal(false);
                    setShowExecuteConfigModal(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                >
                  Back to Execution
                </button>
                <button
                  onClick={() => setShowGraphModal(false)}
                  className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
