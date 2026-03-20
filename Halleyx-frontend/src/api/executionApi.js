import api from "./axios";

export const executionApi = {

  // 🚀 START WORKFLOW
  async startWorkflow(workflowId, data) {
    const res = await api.post(
      `/workflows/${workflowId}/execute`,
      // ⚠️ backend expects STRING
      JSON.stringify(data)
    );
    return res.data;
  },

  // 📄 GET ALL EXECUTIONS
  async getAllExecutions() {
    const res = await api.get(`/executions`);
    return res.data;
  },

  // 🔍 GET SINGLE EXECUTION
  async getExecution(id) {
    const res = await api.get(`/executions/${id}`);
    return res.data;
  },

  // ❌ CANCEL EXECUTION
  async cancelExecution(id) {
    const res = await api.post(`/executions/${id}/cancel`);
    return res.data;
  },

  // 🔁 RETRY EXECUTION
  async retryExecution(id) {
    const res = await api.post(`/executions/${id}/retry`);
    return res.data;
  },

  // ✅ COMPLETE STEP
  async completeStep(id) {
    const res = await api.post(`/executions/${id}/complete-step`);
    return res.data;
  }
  

};