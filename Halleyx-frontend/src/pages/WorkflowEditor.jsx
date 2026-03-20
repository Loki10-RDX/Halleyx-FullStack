import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { workflowApi } from '../api/workflowApi';

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);

  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    status: 'draft',
    inputSchema: '{\n  "type": "object",\n  "properties": {}\n}',
    isActive: true
  });
  const [fields, setFields] = useState([
  { name: "amount", type: "number" },
  { name: "country", type: "string" },
  { name: "priority", type: "string" }
]);
const handleVersionChange = (versionId) => {

  const version = versions.find(v => v.id === versionId);

  if (!version) return;

  setSelectedVersion(versionId);

  let schemaObj = {};

  try {
    schemaObj = JSON.parse(version.inputSchema);
  } catch (e) {
    console.error("Schema parse error:", e);
  }

  const loadedFields = Object.keys(schemaObj).map(key => ({
    name: key,
    type: schemaObj[key].type || "string"
  }));

  setFields(loadedFields);
};
const addField = () => {
  setFields([...fields, { name: "", type: "string" }]);
};

const updateField = (index, key, value) => {
  const updated = [...fields];
  updated[index][key] = value;
  setFields(updated);
};

const deleteField = (index) => {
  setFields(fields.filter((_, i) => i !== index));
};
  const generateSchema = () => {

  const schema = {};

  fields.forEach(field => {
    

    if (!field.name) return;

    schema[field.name] = {
      type: field.type,
      required: true
    };

    if (field.name === "priority") {
      schema[field.name].allowed_values = ["High", "Medium", "Low"];
    }

  });

  return schema;
};
const hasChanges = (() => {
  try {
    return JSON.stringify(generateSchema()) !== JSON.stringify(JSON.parse(workflow.inputSchema || "{}"));
  } catch (e) {
    return true;
  }
})();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
const [versions, setVersions] = useState([]);
const [selectedVersion, setSelectedVersion] = useState(null);

useEffect(() => {
  if (!isEditing) return;

  const fetchWorkflow = async () => {
    try {

      const data = await workflowApi.getWorkflow(id);

      let schemaObj = {};

      if (data?.inputSchema) {
        try {
          schemaObj =
            typeof data.inputSchema === "string"
              ? JSON.parse(data.inputSchema)
              : data.inputSchema;
        } catch (e) {
          console.error("Schema parse error:", e);
        }
        // load all versions of this workflow
        const versionsData = await workflowApi.getWorkflowVersions(data.name);

        setVersions(versionsData);

        const activeVersion = versionsData.find(v => v.isActive);

        if (activeVersion) {
          setSelectedVersion(activeVersion.id);
        }
      }

      setWorkflow({
        name: data?.name || "",
        description: "",
        status: data?.isActive ? "active" : "inactive",
        inputSchema: JSON.stringify(schemaObj || {}, null, 2),
        isActive: data?.isActive || false
      });

          const loadedFields = Object.keys(schemaObj).map(key => ({
        name: key,
        type: schemaObj[key].type || "string"
      }));

        setFields(loadedFields);

     

    } catch (err) {
      console.error("Workflow load error:", err);
      setError("Failed to load workflow.");
    } finally {
      setLoading(false);
    }
  };

  fetchWorkflow();

}, [id, isEditing]);
  const handleChange = (field, value) => {
    setWorkflow(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {

  setSaving(true);
  setError(null);

  const parsedSchema = generateSchema();

  // Frontend schema exact-match prevention removed to support version overriding / activation based on selectedVersion.

  try {

    const payload = {
      name: workflow.name.trim(),
      inputSchema: parsedSchema
    };

    let response;

    if (isEditing) {
      response = await workflowApi.updateWorkflow(selectedVersion || id, payload);
    } else {
      response = await workflowApi.createWorkflow(payload);
    }

    // success message
    navigate('/workflows');

  } catch (err) {

    console.error("Workflow save error:", err);

    setError(
      err.response?.data?.message ||
      "No changes detected. Workflow schema is identical."
    );
    setShowErrorModal(true);

  } finally {
    setSaving(false);
  }

};


  

  if (loading) {
    return <div className="p-8 text-center text-surface-400">Loading workflow...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500">
        <Link to="/workflows" className="hover:text-surface-300 transition-colors">Workflows</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-surface-300">{isEditing ? 'Edit Workflow' : 'New Workflow'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Workflow' : 'Create Workflow'}</h1>        </div>
        <div className="flex items-center gap-3">
          <Link to="/workflows" className="btn-secondary">Cancel</Link>
         <button
              onClick={handleSave}
              disabled={saving || !workflow.name.trim() || (isEditing && !hasChanges)}
              className="btn-primary"
            >
            {saving ? 'Saving...' : isEditing ? 'Update Workflow' : 'Create Workflow'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-8 space-y-6 animate-slide-up">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Workflow Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={workflow.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isEditing}
            placeholder="Enter workflow name..."
            className={`input-field ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {isEditing && <p className="mt-2 text-xs text-surface-500">Name cannot be changed after creation.</p>}
        </div>

        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Version
            </label>

            <select
              value={selectedVersion || ""}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="input-field"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  v{v.version} {v.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Schema Editor */}
      <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h2 className="text-xl font-semibold text-white mb-2">Input Schema (JSON)</h2>
        <p className="text-surface-400 text-sm mb-6">Define the expected JSON input schema for this workflow.</p>
       <div className="space-y-3">

  {fields.map((field, index) => (

    <div key={index} className="flex gap-3">

      <input
        type="text"
        placeholder="Field name"
        value={field.name}
        onChange={(e) =>
          updateField(index, "name", e.target.value)
        }
        className="flex-1 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-surface-300"
      />

      <select
        value={field.type}
        onChange={(e) =>
          updateField(index, "type", e.target.value)
        }
        className="bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-surface-300"
      >
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
      </select>

      <button
        onClick={() => deleteField(index)}
        className="text-red-400 hover:text-red-300"
      >
        ✕
      </button>

    </div>

  ))}

  <button
    onClick={addField}
    className="text-primary-400 hover:text-primary-300 text-sm"
  >
    + Add Field
  </button>

        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm"
            onClick={() => setShowErrorModal(false)}
          />
          
          {/* Modal Content */}
          <div className="glass-card max-w-md w-full relative overflow-hidden shadow-2xl shadow-red-500/10 animate-slide-up">
            {/* Header Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-amber-500" />
            
            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 relative">
                  <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping opacity-25" />
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-bold text-white tracking-tight">Configuration Error</h3>
                <p className="text-surface-400 text-sm">We encountered an issue while saving your workflow. Please check the details below.</p>
              </div>

              {/* Error Box */}
              <div className="bg-surface-900/50 border border-surface-700/50 rounded-xl p-4 mb-8">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">System Message</p>
                    <p className="text-red-200 text-sm font-medium leading-relaxed">
                      {error || "An unexpected error occurred. Please try again or contact support if the issue persists."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setError(null);
                }}
                className="w-full btn-primary !rounded-xl !py-3.5 shadow-lg shadow-primary-500/20"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
