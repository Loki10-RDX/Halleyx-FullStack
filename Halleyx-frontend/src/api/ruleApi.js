import api from "./axios";

export const ruleApi = {

  async getRules(stepId) {
    const res = await api.get(`/steps/${stepId}/rules`);
    return res.data;
  },

  async createRule(stepId, data) {
    const res = await api.post(`/steps/${stepId}/rules`, data);
    return res.data;
  },

  async updateRule(id, data) {
    const res = await api.put(`/rules/${id}`, data);
    return res.data;
  },

  async deleteRule(id) {
    const res = await api.delete(`/rules/${id}`);
    return res.data;
  }

};