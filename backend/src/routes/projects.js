import { Router } from "express";
import { validate, schemas } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import * as projectController from "../controllers/projectController.js";

const router = Router();

// Every project route requires a valid Supabase session token
router.use(authenticate);

// Dashboard stats (owner-scoped, no :id)
router.get("/dashboard", projectController.dashboardHandler);

// Create project
router.post(
  "/",
  validate(schemas.createProject),
  projectController.createProjectHandler
);

// List projects (paginated, with search/filter)
router.get(
  "/",
  validate(schemas.projectQuery, "query"),
  projectController.listProjectsHandler
);

// All :id routes first validate the UUID shape (400), then resolve ownership (404)
router.use("/:id", validate(schemas.uuidParam, "params"));

// Get single project
router.get("/:id", projectController.getProjectHandler);

// Update project
router.patch(
  "/:id",
  validate(schemas.updateProject),
  projectController.updateProjectHandler
);

// Delete project
router.delete("/:id", projectController.deleteProjectHandler);

// List pipeline runs for project
router.get(
  "/:id/pipelines",
  validate(schemas.pipelineQuery, "query"),
  projectController.listPipelineRunsHandler
);

// List test reports for project
router.get(
  "/:id/tests",
  projectController.getProjectHandler
);

// List deployments for project
router.get(
  "/:id/deployments",
  validate(schemas.deploymentQuery, "query"),
  projectController.listDeploymentsHandler
);

export default router;
