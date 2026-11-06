import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FolderGit2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  ExternalLink,
  GitMerge,
  Package,
  MailCheck,
} from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody, CardHeader } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { projectApi, getApiErrorMessage } from "../api/client.js";

function StatCardSkeleton({ className = "" }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardBody className="p-4 sm:p-6">
        <div className="h-4 w-20 bg-navy-150 rounded mb-2" />
        <div className="h-8 w-12 bg-navy-150 rounded" />
      </CardBody>
    </Card>
  );
}

function ProjectCardSkeleton({ className = "" }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardBody className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-200 text-primary-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-4 w-24 bg-navy-150 rounded mb-2" />
              <div className="h-3 w-full bg-navy-150 rounded mb-2" />
              <div className="flex gap-3">
                <div className="h-3 w-16 bg-navy-150 rounded" />
                <div className="h-3 w-12 bg-navy-150 rounded" />
              </div>
            </div>
          </div>
          <div className="h-5 w-12 bg-navy-150 rounded flex-shrink-0" />
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const notice = location.state?.notice || null;

  const load = () => {
    setLoading(true);
    setError("");
    projectApi
      .dashboard()
      .then((res) => setData(res.data ?? res))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load dashboard.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8">
      {notice && (
        <div
          role="status"
          className="p-4 rounded-lg bg-success-500/10 border border-success-500/20 text-success-300 text-sm flex items-start gap-3"
        >
          <MailCheck className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">{notice.title}</p>
            <p className="text-slate-300">{notice.body}</p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array(4).fill(0).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {Array(3).fill(0).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardBody className="p-8">
            <EmptyState
              icon="inbox"
              title="Couldn't load your dashboard"
              description={error}
              action={
                <Button variant="primary" onClick={load}>
                  Try again
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-slate-400">Monitor your projects, pipelines, and deployments.</p>
            </div>
            <Link to="/projects/add">
              <Button variant="primary">
                <FolderGit2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Add project
              </Button>
            </Link>
          </div>

          {/* Summary cards — all numbers come from the backend, never fabricated */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active projects</p>
                  <FolderGit2 className="w-5 h-5 text-slate-500" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.activeProjects ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">of {stats.totalProjects ?? 0} total</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Running pipelines</p>
                  <Play className="w-5 h-5 text-primary-400 animate-pulse-slow" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-primary-400">{stats.runningPipelines ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">actively running or pending</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Successful</p>
                  <CheckCircle className="w-5 h-5 text-success-500" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-success-400">{stats.successfulPipelines ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">passing builds</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Failed</p>
                  <XCircle className="w-5 h-5 text-error-500" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-error-400">{stats.failedPipelines ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">needs attention</p>
              </CardBody>
            </Card>
          </div>

          {/* Recent projects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent projects</h2>
              <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300">
                View all
              </Link>
            </div>

            {!data.recentProjects || data.recentProjects.length === 0 ? (
              <Card>
                <CardBody className="p-0">
                  <EmptyState
                    title="No projects yet"
                    description="Add your first project to start monitoring CI/CD pipelines."
                    action={
                      <Link to="/projects/add">
                        <Button>Add project</Button>
                      </Link>
                    }
                  />
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {data.recentProjects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                    <Card className="group h-full">
                      <CardBody className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-200 text-primary-400 flex-shrink-0">
                              <GitMerge className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                                {project.name || "Untitled project"}
                              </h3>
                              {project.repo_owner && project.repo_name && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {project.repo_owner}/{project.repo_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge status={project.status} />
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-navy-200/50">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" aria-hidden="true" />
                            {project.language || "—"}
                          </span>
                          {project.updated_at && (
                            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent pipelines</h2>
                <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300" aria-label="All pipelines">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {!data.recentPipelines || data.recentPipelines.length === 0 ? (
                  <EmptyState
                    title="No pipeline runs yet"
                    description="Pipelines appear here once your projects start producing CI/CD runs."
                  />
                ) : (
                  <div className="divide-y divide-navy-200">
                    {data.recentPipelines.map((pipeline) => (
                      <div key={pipeline.id} className="p-4 flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                            pipeline.status === "success"
                              ? "bg-success-500/10 text-success-400"
                              : pipeline.status === "failed"
                                ? "bg-error-500/10 text-error-400"
                                : pipeline.status === "running"
                                  ? "bg-primary-500/10 text-primary-400"
                                  : "bg-navy-200/50 text-slate-500"
                          }`}
                        >
                          <StatusGlyph status={pipeline.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{pipeline.ref || "main"}</p>
                          <p className="text-xs text-slate-500">
                            {pipeline.created_at ? new Date(pipeline.created_at).toLocaleTimeString() : "—"}
                          </p>
                        </div>
                        {pipeline.duration_ms && (
                          <span className="text-xs text-slate-500">
                            {Math.floor(pipeline.duration_ms / 1000)}s
                          </span>
                        )}
                        <Badge status={pipeline.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent deployments</h2>
                <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300" aria-label="All projects">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {!data.recentDeployments || data.recentDeployments.length === 0 ? (
                  <EmptyState
                    title="No deployments yet"
                    description="Deployments appear here once your projects start deploying."
                  />
                ) : (
                  <div className="divide-y divide-navy-200">
                    {data.recentDeployments.map((dep) => (
                      <div key={dep.id} className="p-4 flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                            dep.status === "success"
                              ? "bg-success-500/10 text-success-400"
                              : dep.status === "failed"
                                ? "bg-error-500/10 text-error-400"
                                : dep.status === "in_progress"
                                  ? "bg-primary-500/10 text-primary-400"
                                  : "bg-navy-200/50 text-slate-500"
                          }`}
                        >
                          <Server className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate capitalize">{dep.environment || "—"}</p>
                          <p className="text-xs text-slate-500">
                            {dep.created_at ? new Date(dep.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <Badge status={dep.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Icon per pipeline/deployment status
const STATUS_ICONS = {
  pending: Clock,
  running: Play,
  success: CheckCircle,
  failed: XCircle,
  cancelled: Pause,
};

function StatusGlyph({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  return <Icon className="w-4 h-4" aria-hidden="true" />;
}
