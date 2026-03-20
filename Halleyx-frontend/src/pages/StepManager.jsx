import { useState, useMemo } from 'react';
import { stepApi } from '../api/stepApi';


export default function StepManager({ workflowId, isEditing, steps, onStepsChange }) {
  const [editingStep, setEditingStep] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfigVisible, setIsConfigVisible] = useState(false);

  const [stepForm, setStepForm] = useState({
    name: '',
    stepType: 'TASK',
    order: 1,
    metadata: '{\n  "assigneeEmail": "user@example.com"\n}'
  });

  const isStepFormDirty = useMemo(() => {
    if (!editingStep) return true;
    return (
      stepForm.name !== editingStep.name ||
      stepForm.stepType !== editingStep.stepType ||
      Number(stepForm.order) !== Number(editingStep.order) ||
      stepForm.metadata !== (editingStep.metadata || '{\n  "assigneeEmail": "user@example.com"\n}')
    );
  }, [stepForm, editingStep]);


  const defaultMetadata = '{\n  "assigneeEmail": "user@example.com"\n}';

  const handleOpenStepForm = (step = null) => {
    setIsConfigVisible(true);
    if (step) {
      setEditingStep(step);
      setStepForm({
        name: step.name,
        stepType: step.stepType,
        order: step.order,
        metadata: step.metadata || defaultMetadata
      });
    } else {
      setEditingStep(null);
      setStepForm({
        name: '',
        stepType: 'TASK',
        order: steps.length > 0 ? Math.max(...steps.map(s => s.order || 0)) + 1 : 1,
        metadata: defaultMetadata
      });
    }
  };
const handleSaveStep = async () => {
  try {
    let parsedMetadata;

    try {
      parsedMetadata = JSON.parse(stepForm.metadata);
    } catch (e) {
      setErrorMessage('Invalid JSON in Metadata: ' + e.message);
      setShowErrorModal(true);
      return;
    }

    const payload = {
      name: stepForm.name,
      stepType: stepForm.stepType,
      stepOrder: parseInt(stepForm.order, 10),
      metadata: JSON.stringify(parsedMetadata)
    };

              if (!stepForm.name.trim()) {
              setErrorMessage("Step name is required");
              setShowErrorModal(true);
              return;
            }

            if (editingStep) {
              await stepApi.updateStep(editingStep.id, payload);
            } else {
              await stepApi.createStep(workflowId, payload);
            }

    const newSteps = await stepApi.getSteps(workflowId);

    const formattedSteps = newSteps.map(s => ({
      ...s,
      order: s.stepOrder
    }));

    onStepsChange(formattedSteps);
    setIsConfigVisible(false);

    setEditingStep(null);
    setStepForm({
      name: '',
      stepType: 'TASK',
      order: formattedSteps.length > 0
        ? Math.max(...formattedSteps.map(s => s.order)) + 1
        : 1,
      metadata: defaultMetadata
    });

  } catch (err) {
    console.error('Save step failed:', err);
    setErrorMessage(err.response?.data?.message || err.message || 'Failed to save step.');
    setShowErrorModal(true);
  }
};
  const confirmDelete = (stepId) => {
    setStepToDelete(stepId);
    setShowDeleteModal(true);
  };

  const handleDeleteStep = async () => {
    if (!stepToDelete) return;
    try {
      await stepApi.deleteStep(stepToDelete);
      const newSteps = await stepApi.getSteps(workflowId);

      const formattedSteps = newSteps.map(s => ({
        ...s,
        order: s.stepOrder
      }));

      onStepsChange(formattedSteps);
      setShowDeleteModal(false);
      setStepToDelete(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete step.');
      setShowErrorModal(true);
    }
  };
const handleDuplicateStep = (step) => {
  setIsConfigVisible(true);
  setEditingStep(null);

  setStepForm({
    name: step.name + " Copy",
    stepType: step.stepType,
    order: steps.length > 0 
      ? Math.max(...steps.map(s => s.order || 0)) + 1 
      : 1,
    metadata: step.metadata || defaultMetadata
  });
};
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column: List */}
      <div className="flex-1 w-full space-y-6">
        <button 
          onClick={() => handleOpenStepForm()} 
          disabled={!isEditing}
          className="btn-primary !py-2.5 flex items-center gap-2 shadow-lg shadow-primary-500/10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Step
        </button>

        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-800/50">
            {!isEditing ? (
              <div className="p-12 text-center">
                <h3 className="text-surface-400 font-medium mb-1">Workflow not saved</h3>
                <p className="text-surface-500 text-sm">Save the workflow first to start adding steps.</p>
              </div>
            ) : steps.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-surface-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-surface-400 font-medium mb-1">No steps yet</h3>
                <p className="text-surface-500 text-sm">Create the first step of this workflow.</p>
              </div>
            ) : (
              steps.map((step) => (
                  <div 
                    key={step.id} 
                    onClick={() => handleOpenStepForm(step)}
                    className={`group flex items-center gap-4 p-4 transition-colors cursor-pointer ${
                      editingStep?.id === step.id 
                        ? 'bg-primary-500/10 border-l-2 border-primary-500' 
                        : 'hover:bg-surface-800/30'
                    }`} 
                  >    
                    <div className="cursor-grab active:cursor-grabbing text-surface-600 hover:text-surface-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 9h8m-8 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="8" cy="9" r="1" />
                      <circle cx="12" cy="9" r="1" />
                      <circle cx="16" cy="9" r="1" />
                      <circle cx="8" cy="15" r="1" />
                      <circle cx="12" cy="15" r="1" />
                      <circle cx="16" cy="15" r="1" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{step.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-700 text-surface-400 uppercase tracking-wider">
                      {step.stepType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {e.stopPropagation();handleOpenStepForm(step); }}
                      className="p-1.5 rounded-lg text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                      title="Edit Step"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button 
                     onClick={(e) => {e.stopPropagation(); confirmDelete(step.id);}}
                      className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Delete Step"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="glass-card bg-primary-500/5 border-primary-500/20 p-4 flex gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          <p className="text-surface-300 text-sm leading-relaxed">
            You can define rules to control step transitions by navigating to the Rules tab.
          </p>
        </div>
      </div>

      {/* Right Column: Configuration Panel */}
      {isConfigVisible && (
        <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-8 animate-fade-in relative z-10">
          <div className="glass-card p-6 space-y-6 relative">
            <button 
              onClick={() => setIsConfigVisible(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-white transition-colors"
              title="Close Panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight pr-6">Step Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Step Name</label>
                <input 
                  type="text" 
                  value={stepForm.name} 
                  onChange={e => setStepForm(prev => ({...prev, name: e.target.value}))} 
                  className="input-field !bg-surface-900/50" 
                  placeholder="e.g. Manager Approval"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Step Type</label>
                <select 
                  value={stepForm.stepType} 
                  onChange={e => setStepForm(prev => ({...prev, stepType: e.target.value}))} 
                  className="input-field !bg-surface-900/50"
                >
                  <option value="TASK">Task</option>
                  <option value="APPROVAL">Approval</option>
                  <option value="NOTIFICATION">Notification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-400 mb-1.5">Order</label>
                <select
                  value={stepForm.order}
                  onChange={e => setStepForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="input-field !bg-surface-900/50"
                >
                  {Array.from({ length: Math.max(steps.length + 1, 1) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Mock Accordion for Metadata */}
              <div className="border border-surface-700/50 rounded-xl overflow-hidden">
                <button className="w-full p-3 flex items-center justify-between text-sm font-medium text-surface-300 hover:bg-surface-800 transition-colors">
                  Other Metadata
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div className="p-3 bg-surface-900/30">
                  <textarea 
                    value={stepForm.metadata} 
                    onChange={e => setStepForm(prev => ({...prev, metadata: e.target.value}))} 
                    className="w-full bg-transparent border-none text-xs text-surface-400 font-mono resize-none focus:ring-0 p-0 h-24" 
                    placeholder="{}"
                    spellCheck="false"
                  />
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleSaveStep} 
              disabled={!stepForm.name.trim() || (editingStep && !isStepFormDirty)}
              className="w-full btn-primary !rounded-xl !py-3 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingStep ? 'Update Step' : 'Save'}
            </button>
          </div>
        </aside>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="pt-8 px-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Step</h3>
              <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this step? This action cannot be undone.</p>
            </div>
            <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-700/30 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStepToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-100 rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStep}
                className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="h-1 bg-red-500" />
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Action Required</h3>
              <p className="text-slate-400 text-sm text-center mb-8">{errorMessage}</p>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
