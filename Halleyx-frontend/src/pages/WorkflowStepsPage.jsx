import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { stepApi } from '../api/stepApi';
import { workflowApi } from '../api/workflowApi';
import StepManager from './StepManager';

export default function WorkflowStepsPage() {
  const { id } = useParams();
  const [steps, setSteps] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wfData = await workflowApi.getWorkflow(id);
        setWorkflow(wfData);
        
        const stepsData = await stepApi.getSteps(id);
        const formattedSteps = stepsData.map(s => ({
          ...s,
          order: s.stepOrder
        }));
        setSteps(formattedSteps);
      } catch (err) {
        console.error("Failed to load", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-surface-400">Loading steps...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500">
        <Link to="/workflows" className="hover:text-surface-300 transition-colors">Workflows</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <Link to={`/workflows/${id}`} className="hover:text-surface-300 transition-colors">{workflow?.name || 'Workflow'}</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-surface-300">Manage Steps</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manage Steps</h1>
          <p className="mt-2 text-surface-400">Configure execution steps for <span className="text-white font-medium">{workflow?.name}</span></p>
        </div>
      </div>

      <StepManager 
        workflowId={id} 
        isEditing={true} 
        steps={steps} 
        onStepsChange={setSteps} 
      />
    </div>
  );
}
