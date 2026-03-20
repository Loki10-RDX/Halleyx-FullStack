import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import WorkflowStepsPage from './pages/WorkflowStepsPage';
import WorkflowRulesPage from './pages/WorkflowRulesPage';
import ExecutionPage from './pages/ExecutionPage';
import AuditLogPage from './pages/AuditLogPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/workflows" replace />} />
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/new" element={<WorkflowEditor />} />
        <Route path="workflows/:id" element={<WorkflowEditor />} />
        <Route path="workflows/:id/steps" element={<WorkflowStepsPage />} />
        <Route path="workflows/:id/rules" element={<WorkflowRulesPage />} />
        <Route path="executions" element={<ExecutionPage />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
      </Route>
    </Routes>
  );
}

export default App;
