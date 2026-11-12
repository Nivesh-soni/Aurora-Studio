import axios from "axios";
import { API_URL, authenticatedRequest } from "./http";

export async function createProject(token, project = {}) {
  const { data } = await axios.post(`${API_URL}/api/projects`, project, authenticatedRequest(token));
  return data;
}

export async function getProject(projectId, token) {
  const { data } = await axios.get(`${API_URL}/api/projects/${projectId}`, authenticatedRequest(token));
  return data;
}

export async function getProjects(token) {
  const { data } = await axios.get(`${API_URL}/api/projects`, authenticatedRequest(token));
  return data;
}

export async function saveProject(projectId, project, token) {
  const { data } = await axios.patch(`${API_URL}/api/projects/${projectId}`, project, authenticatedRequest(token));
  return data;
}

export async function deleteProject(projectId, token) {
  await axios.delete(`${API_URL}/api/projects/${projectId}`, authenticatedRequest(token));
}

export async function exportProject(projectId, settings, token) {
  const { data } = await axios.post(`${API_URL}/api/projects/${projectId}/export`, settings, {
    ...authenticatedRequest(token),
    responseType: "blob",
    timeout: 0,
  });
  return data;
}

export async function getExportProgress(projectId, exportId, token) {
  const { data } = await axios.get(
    `${API_URL}/api/projects/${projectId}/export/${exportId}/progress`,
    authenticatedRequest(token),
  );
  return data;
}

export async function cancelExport(projectId, exportId, token) {
  await axios.delete(
    `${API_URL}/api/projects/${projectId}/export/${exportId}`,
    authenticatedRequest(token),
  );
}
