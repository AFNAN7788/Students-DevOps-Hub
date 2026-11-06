import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";

export async function createProject(ownerId, data) {
  return prisma.project.create({
    data: {
      ...data,
      owner_id: ownerId,
    },
  });
}

export async function getProjects(ownerId, { page = 1, limit = 12, search, status, visibility, sort = "created_at", order = "desc" }) {
  const where = {
    owner_id: ownerId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { repo_name: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status }),
    ...(visibility && { visibility }),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        pipelines: { orderBy: { created_at: "desc" }, take: 1 },
        _count: { select: { pipelines: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProjectById(id, ownerId) {
  const project = await prisma.project.findFirst({
    where: { id, owner_id: ownerId },
    include: {
      pipelines: {
        orderBy: { created_at: "desc" },
        take: 10,
        include: {
          test_reports: true,
          deployments: { orderBy: { created_at: "desc" }, take: 5 },
        },
      },
      test_reports: { orderBy: { created_at: "desc" }, take: 10 },
      deployments: { orderBy: { created_at: "desc" }, take: 10 },
      _count: { select: { pipelines: true, test_reports: true, deployments: true } },
    },
  });

  if (!project) {
    throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  return project;
}

export async function updateProject(id, ownerId, data) {
  const project = await prisma.project.findFirst({
    where: { id, owner_id: ownerId },
  });

  if (!project) {
    throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id, ownerId) {
  const project = await prisma.project.findFirst({
    where: { id, owner_id: ownerId },
  });

  if (!project) {
    throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");
  }

  await prisma.project.delete({ where: { id } });
  return { success: true };
}

export async function getDashboardStats(ownerId) {
  const [projects, pipelines, deployments] = await Promise.all([
    prisma.project.findMany({
      where: { owner_id: ownerId },
      select: { id: true, status: true, updated_at: true },
    }),
    prisma.pipelineRun.findMany({
      where: { project: { owner_id: ownerId } },
      select: { status: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.deployment.findMany({
      where: { project: { owner_id: ownerId } },
      select: { status: true, environment: true, created_at: true },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalProjects = projects.length;

  const recentPipelines = pipelines.slice(0, 5);
  const runningPipelines = pipelines.filter((p) => p.status === "running" || p.status === "pending").length;
  const failedPipelines = pipelines.filter((p) => p.status === "failed").length;
  const successfulPipelines = pipelines.filter((p) => p.status === "success").length;

  const recentDeployments = deployments.slice(0, 5);

  return {
    stats: {
      totalProjects,
      activeProjects,
      totalPipelines: pipelines.length,
      runningPipelines,
      successfulPipelines,
      failedPipelines,
    },
    recentProjects: projects
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5),
    recentPipelines,
    recentDeployments,
  };
}

export async function getPipelineRuns(projectId, ownerId, { page = 1, limit = 20, status }) {
  const project = await prisma.project.findFirst({ where: { id: projectId, owner_id: ownerId } });
  if (!project) throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");

  const where = { project_id: projectId, ...(status && { status }) };

  const [items, total] = await Promise.all([
    prisma.pipelineRun.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { test_reports: true, deployments: { orderBy: { created_at: "desc" }, take: 3 } },
    }),
    prisma.pipelineRun.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getDeployments(projectId, ownerId, { page = 1, limit = 20, environment, status }) {
  const project = await prisma.project.findFirst({ where: { id: projectId, owner_id: ownerId } });
  if (!project) throw new AppError("Project not found.", 404, "PROJECT_NOT_FOUND");

  const where = { project_id: projectId, ...(environment && { environment }), ...(status && { status }) };

  const [items, total] = await Promise.all([
    prisma.deployment.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.deployment.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}