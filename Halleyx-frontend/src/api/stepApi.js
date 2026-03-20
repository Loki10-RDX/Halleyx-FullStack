import api from "./axios";

export const stepApi = {

  async getSteps(workflowId) {
    const res = await api.get(`/workflows/${workflowId}/steps`);
    return res.data;
  },

  async createStep(workflowId, data) {
    const res = await api.post(`/workflows/${workflowId}/steps`, data);
    return res.data;
  },

  async updateStep(id, data) {
    const res = await api.put(`/steps/${id}`, data);
    return res.data;
  },

  async deleteStep(id) {
    const res = await api.delete(`/steps/${id}`);
    return res.data;
  }

};