import { workflowApi } from "../api/workflowApi";

export const workflowService = {

  async getAll() {
    return await workflowApi.getWorkflows();
  },

  async getById(id) {
    return await workflowApi.getWorkflow(id);
  },

  async create(data) {
    return await workflowApi.createWorkflow(data);
  },

  async update(id, data) {
  return await workflowApi.updateWorkflow(id, data);
},

async remove(id) {
  return await workflowApi.deleteWorkflow(id);
}

};