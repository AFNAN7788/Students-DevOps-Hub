import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getDashboardStats,
  getPipelineRuns,
  getDeployments,
} from "../services/projectService.js";
import { sendSuccess } from "../utils/errors.js";

export async function createProjectHandler(req, res, next) {
  try {
    const project = await createProject(req.userId, req.body);
    return sendSuccess(res, project, 201);
  } catch (err) {
    next(err);
  }
}

export async function listProjectsHandler(req, res, next) {
  try {
    const data = await getProjects(req.userId, req.query);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getProjectHandler(req, res, next) {
  try {
    const project = await getProjectById(req.params.id, req.userId);
    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectHandler(req, res, next) {
  try {
    const project = await updateProject(req.params.id, req.userId, req.body);
    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectHandler(req, res, next) {
  try {
    await deleteProject(req.params.id, req.userId);
    return sendSuccess(res, { message: "Project deleted." });
  } catch (err) {
    next(err);
  }
}

export async function dashboardHandler(req, res, next) {
  try {
    const data = await getDashboardStats(req.userId);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listPipelineRunsHandler(req, res, next) {
  try {
    const data = await getPipelineRuns(req.params.id, req.userId, req.query);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listDeploymentsHandler(req, res, next) {
  try {
    const data = await getDeployments(req.params.id, req.userId, req.query);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
