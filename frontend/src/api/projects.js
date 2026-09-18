import apiClient from "./client";

export async function listProjects() {
  const { data } = await apiClient.get("/projects");
  return data.projects;
}

export async function getProject(id) {
  const { data } = await apiClient.get(`/projects/${id}`);
  return data.project;
}

export async function createProject(payload) {
  const { data } = await apiClient.post("/projects", payload);
  return data.project;
}

export async function deleteProject(id) {
  await apiClient.delete(`/projects/${id}`);
}

export async function addSite(projectId, payload) {
  const { data } = await apiClient.post(
    `/projects/${projectId}/sites`,
    payload,
  );
  return data.site;
}

export async function listAllSites() {
  const { data } = await apiClient.get("/sites");
  return data.sites;
}

export async function getSite(id) {
  const { data } = await apiClient.get(`/sites/${id}`);
  return data.site;
}

export async function getSiteMetrics(id) {
  const { data } = await apiClient.get(`/sites/${id}/metrics`);
  return data.metrics;
}
