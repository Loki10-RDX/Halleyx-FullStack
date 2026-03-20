import { useEffect, useState, useMemo } from "react";
import { ruleApi } from "../api/ruleApi";
export default function RuleManager({ steps }) {

  const [selectedStepId, setSelectedStepId] = useState("");
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const [ruleForm, setRuleForm] = useState({
    condition: "",
    nextStepId: ""
  });

  const isRuleFormDirty = useMemo(() => {
    if (!editingRule) return true;
    const currentNextStepId = editingRule.nextStep?.id || editingRule.nextStepId || "";
    return (
      ruleForm.condition !== editingRule.condition ||
      ruleForm.nextStepId !== currentNextStepId
    );
  }, [ruleForm, editingRule]);
  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      await ruleApi.deleteRule(ruleToDelete);
      const updated = await ruleApi.getRules(selectedStepId);
      setRules(updated);
      setShowConfirmDelete(false);
      setRuleToDelete(null);
    } catch (err) {
      setErrorMessage("Unable to delete rule right now. Please refresh and try again.");
      setShowErrorModal(true);
      console.error("Delete rule failed", err);
      setShowConfirmDelete(false);
      setRuleToDelete(null);
    }
  };

  const promptDeleteRule = (ruleId) => {
    setRuleToDelete(ruleId);
    setShowConfirmDelete(true);
  };
const handleEditRule = (rule) => {
  setEditingRule(rule);

  setRuleForm({
    condition: rule.condition,
    nextStepId: rule.nextStep?.id || rule.nextStepId
  });
};

  // Load rules when step changes
  // Auto select first step
useEffect(() => {
  if (steps.length > 0 && !selectedStepId) {
    setSelectedStepId(steps[0].id);
  }
}, [steps]);

// Fetch rules when step changes
useEffect(() => {
  if (!selectedStepId) return;

  const fetchRules = async () => {
    try {
      const data = await ruleApi.getRules(selectedStepId);
      setRules(data);
    } catch (err) {
      console.error("Failed to load rules", err);
    }
  };

  fetchRules();
}, [selectedStepId]);

const handleSaveRule = async () => {
  if (!ruleForm.condition.trim()) {
    setErrorMessage("Please enter a valid condition to continue.");
    setShowErrorModal(true);
    return;
  }

  if (!ruleForm.nextStepId) {
    setErrorMessage("Please select the next step before saving the rule.");
    setShowErrorModal(true);
    return;
  }

  try {
    if (editingRule) {
      // 🔥 UPDATE MODE
      await ruleApi.updateRule(editingRule.id, {
        condition: ruleForm.condition,
        nextStepId: ruleForm.nextStepId
      });
    } else {
      // 🔥 CREATE MODE
      await ruleApi.createRule(selectedStepId, {
        condition: ruleForm.condition,
        nextStepId: ruleForm.nextStepId
      });
    }

    const updated = await ruleApi.getRules(selectedStepId);
    setRules(updated);

    // reset
    setEditingRule(null);
    setRuleForm({ condition: "", nextStepId: "" });

  } catch (err) {
    console.error(err);
    setErrorMessage("Could not save the rule due to a server error. Please try again in a moment.");
    setShowErrorModal(true);
  }
};
  return (
    <div className="space-y-6">

      {/* STEP SELECT */}
      <div>
        <label className="text-sm text-surface-400">Select Step</label>
        <select
          value={selectedStepId}
          onChange={(e) => setSelectedStepId(e.target.value)}
          className="input-field mt-2"
        >
          <option value="">-- Select Step --</option>
          {steps.map(step => (
            <option key={step.id} value={step.id}>
              {step.name}
            </option>
          ))}
        </select>
      </div>

      {/* RULE FORM */}
      {selectedStepId && (
        <div className="glass-card p-6 space-y-4">

          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold">{editingRule ? "Update Rule" : "Create Rule"}</h3>
            {editingRule && (
              <button 
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({ condition: "", nextStepId: "" });
                }}
                className="text-surface-400 hover:text-white transition-colors p-1"
                title="Cancel Edit"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Condition (e.g. amount > 1000)"
            value={ruleForm.condition}
            onChange={(e) =>
              setRuleForm(prev => ({ ...prev, condition: e.target.value }))
            }
            className="input-field"
          />

          <select
            value={ruleForm.nextStepId}
            onChange={(e) =>
              setRuleForm(prev => ({ ...prev, nextStepId: e.target.value }))
            }
            className="input-field"
          >
            <option value="">-- Next Step --</option>
            {steps.map(step => (
              <option key={step.id} value={step.id}>
                {step.name}
              </option>
            ))}
          </select>

          <button 
            onClick={handleSaveRule} 
            disabled={!ruleForm.condition.trim() || !ruleForm.nextStepId || (editingRule && !isRuleFormDirty)}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingRule ? "Update Rule" : "Save Rule"}
          </button>

        </div>
      )}
   
      {/* RULE LIST */}
      {selectedStepId && (
        <div className="glass-card p-6">
          <h3 className="text-white mb-4">Rules</h3>

          {rules.length === 0 ? (
            <p className="text-surface-400 text-sm">No rules yet</p>
          ) : (
          rules.map(rule => (
  <div 
    key={rule.id} 
    className="p-3 border-b border-surface-700 flex justify-between items-center"
  >
    {/* LEFT */}
    <div>
      <p className="text-white text-sm">{rule.condition}</p>
      <p className="text-surface-400 text-xs">
        → Next Step: {steps.find(s => s.id === (rule.nextStep?.id || rule.nextStepId))?.name || "N/A"}
      </p>
    </div>

    {/* RIGHT ACTIONS */}
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleEditRule(rule)}
        className="p-1.5 rounded-lg text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
        title="Edit Rule"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </button>
      <button 
        onClick={() => promptDeleteRule(rule.id)}
        className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
        title="Delete Rule"
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
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Rule</h3>
            <p className="text-sm text-surface-400 mb-6">Are you sure you want to delete this rule? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRule}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Unable to delete rule</h3>
            <p className="text-sm text-surface-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}