import api from "./axios";

export const workflowApi = {

  async getWorkflows(params) {
    const res = await api.get("/workflows", {
      params: params
    });
    return res.data;
  },

  async getWorkflow(id) {
    const res = await api.get(`/workflows/${id}`);
    return res.data;
  },

  async createWorkflow(data) {
    const res = await api.post("/workflows", data);
    return res.data;
  },

  async updateWorkflow(id, data) {
    const res = await api.put(`/workflows/${id}`, data);
    return res.data;
  },

  async deleteWorkflow(id) {
    const res = await api.delete(`/workflows/${id}`);
    return res.data;
  },
      async getWorkflowVersions(name) {
        const res = await api.get(`/workflows/name/${name}`);
        return res.data;
      },
        async deleteWorkflowByName(name) {
    const res = await api.delete(`/workflows/name/${name}`);
    return res.data;
  }

};