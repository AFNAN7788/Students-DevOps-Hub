import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  GitMerge,
  ExternalLink,
  Play,
  Clock,
  Server,
  Package,
  ChevronRight,
  Trash2,
  Pencil,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Tabs, { TabPanel } from "../components/ui/Tabs.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { projectApi, getApiErrorMessage } from "../api/client.js";

function statusColor(status) {
  const map = {
    success: "text-success-400",
    failed: "text-error-400",
    running: "text-primary-400",
    pending: "text-warning-400",
    cancelled: "text-slate-400",
    rolled_back: "text-slate-400",
  };
  return map[status] || "text-slate-500";
}

function Dot({ status }) {
  const pulse = status === "running" ? " animate-pulse" : "";
  const color =
    status === "success"
      ? "bg-success-500"
      : status === "failed"
        ? "bg-error-500"
        : status === "running"
          ? "bg-primary-500"
          : "bg-slate-500";
  return <span className={`w-2 h-2 rounded-full ${color}${pulse}`} aria-hidden="true" />;
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-24 bg-navy-150 rounded" />
      ))}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loadState, setLoadState] = useState({ status: "loading", error: "" });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading", error: "" });
    Promise.allSettled([projectApi.get(id), projectApi.pipelines(id), projectApi.deployments(id)])
      .then(([projectRes, pipelineRes, deploymentRes]) => {
        if (cancelled) return;

        if (projectRes.status === "fulfilled") {
          const loaded = projectRes.value.data ?? projectRes.value;
          if (loaded && loaded.id) {
            setProject(loaded);
            setLoadState({ status: "ready", error: "" });
          } else {
            setProject(null);
            setLoadState({
              status: "not-found",
              error: "Project not found.",
            });
          }
        } else {
          const code = projectRes.reason?.response?.status;
          setLoadState({
            status: code === 404 ? "not-found" : "error",
            error: getApiErrorMessage(projectRes.reason, "Failed to load project details."),
          });
        }
        setPipelines(
          projectRes.status === "fulfilled" && pipelineRes.status === "fulfilled"
            ? (pipelineRes.value.data ?? pipelineRes.value)?.items || []
            : []
        );
        setDeployments(
          projectRes.status === "fulfilled" && deploymentRes.status === "fulfilled"
            ? (deploymentRes.value.data ?? deploymentRes.value)?.items || []
            : []
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const openDeleteModal = () => {
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await projectApi.delete(id);
      navigate("/projects");
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeleting(false);
    }
  };

  if (loadState.status === "loading") {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ProjectDetailSkeleton />
      </div>
    );
  }

  if (loadState.status === "not-found") {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <Card>
          <CardBody className="p-0">
            <EmptyState
              title="Project not found"
              description="This project doesn't exist or you don't have access to it."
              action={
                <Link to="/projects">
                  <Button variant="primary">Back to projects</Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <Card>
          <CardBody className="p-0">
            <EmptyState
              title="Couldn't load the project"
              description={loadState.error}
              action={
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              }
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  const lastPipeline = pipelines[0];
  const lastDeployment = deployments[0];
  // Prefer the most recent pipeline's reports; fall back to the project payload.
  const testReports = lastPipeline?.test_reports?.length
    ? lastPipeline.test_reports
    : project.test_reports || [];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/projects" className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1 inline" aria-hidden="true" /> All projects
        </Link>
        <div className="ml-auto flex gap-2">
          <Link to={`/projects/${id}/edit`}>
            <Button variant="ghost" size="sm">
              <Pencil className="w-3.5 h-3.5 mr-1.5 inline" aria-hidden="true" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={openDeleteModal}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5 inline" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider">
                <Badge status={project.status} />
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" aria-hidden="true" />
                  {project.language || "—"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {project.name || "Untitled project"}
              </h1>
              {project.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{project.description}</p>
              )}
              {project.repo_url && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <GitMerge className="w-3 h-3" aria-hidden="true" />
                  <span className="truncate max-w-md">
                    {project.repo_owner || "unknown"}/{project.repo_name || "unknown"}
                  </span>
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  >
                    Open in GitHub <ExternalLink className="w-3 h-3 inline ml-1" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs defaultValue="overview" ariaLabel="Project sections">
        <TabPanel label="Overview" value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Last build */}
            <Card>
              <CardBody className="p-5">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Last build
                </p>
                {lastPipeline ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400">
                          <Play className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">{lastPipeline.ref || "main"}</p>
                          <p className="text-xs text-slate-500">
                            {lastPipeline.commit_sha?.slice(0, 7) || "no commit"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-navy-200/50 flex items-center gap-2 text-xs">
                      <Dot status={lastPipeline.status} />
                      <span
                        className={`${statusColor(lastPipeline.status)} font-medium capitalize`}
                      >
                        {lastPipeline.status || "unknown"}
                      </span>
                      {lastPipeline.duration_ms && (
                        <span className="text-slate-500 ml-auto">
                          {Math.floor(lastPipeline.duration_ms / 1000)}s
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 py-4">No data yet — no build has run.</p>
                )}
              </CardBody>
            </Card>

            {/* Last deployment */}
            <Card>
              <CardBody className="p-5">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Last deployment
                </p>
                {lastDeployment ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-500/10 text-accent-400">
                          <Server className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white capitalize">
                            {lastDeployment.environment || "—"}
                          </p>
                          {lastDeployment.url && (
                            <a
                              href={lastDeployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-400 hover:text-primary-300 truncate block mt-1"
                            >
                              {lastDeployment.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Dot status={lastDeployment.status} />
                      <span className={`${statusColor(lastDeployment.status)} font-medium capitalize`}>
                        {lastDeployment.status || "unknown"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 py-4">No data yet — no deployment recorded.</p>
                )}
              </CardBody>
            </Card>

            {/* Test summary — rendered only when real report data exists */}
            <Card>
              <CardBody className="p-5 flex flex-col h-full">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Test summary
                </p>
                {testReports.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-500/10 text-success-400 flex-shrink-0">
                        <FlaskConical className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {testReports[0].name || "Latest report"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {testReports[0].duration_ms
                            ? `${Math.round(testReports[0].duration_ms / 1000)}s duration`
                            : "duration unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-navy-200/50">
                      <div>
                        <p className="font-semibold text-success-400">{testReports[0].passed ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-500">Passed</p>
                      </div>
                      <div>
                        <p className="font-semibold text-error-400">{testReports[0].failed ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-500">Failed</p>
                      </div>
                      <div>
                        <p className="font-semibold text-warning-400">{testReports[0].skipped ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-500">Skipped</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 py-4">No data yet — no test report attached.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </TabPanel>

        <TabPanel label="Pipeline history" value="pipelines">
          <div className="space-y-4">
            {pipelines.length === 0 ? (
              <Card>
                <CardBody className="p-0">
                  <EmptyState
                    title="No pipelines yet"
                    description="Connect your CI/CD provider to see pipeline runs here."
                  />
                </CardBody>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-navy-200 bg-navy-100/50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-navy-200">
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Ref</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Commit</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Duration</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Trigger</th>
                      <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-200/50">
                    {pipelines.map((p) => (
                      <tr key={p.id} className="hover:bg-navy-100/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{p.ref || "—"}</td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-400">
                          {p.commit_sha?.slice(0, 7) || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {p.duration_ms ? `${Math.floor(p.duration_ms / 1000)}s` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 capitalize">{p.trigger || "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-400 text-right">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel label="Test reports" value="tests">
          {testReports.length === 0 ? (
            <Card>
              <CardBody className="p-0">
                <EmptyState
                  title="No test reports yet"
                  description="Test reports appear when a pipeline run attaches results."
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {testReports.map((report) => (
                <Card key={report.id} className="flex flex-col">
                  <CardBody className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{report.name || "Test report"}</h3>
                        <p className="text-xs text-slate-500">
                          {report.total ?? (report.passed ?? 0) + (report.failed ?? 0) + (report.skipped ?? 0)} tests
                        </p>
                      </div>
                      <Badge status={report.status} className="flex-shrink-0" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-success-500/10 text-center">
                        <p className="text-sm font-semibold text-success-400">{report.passed ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-400">Passed</p>
                      </div>
                      <div className="p-3 rounded-xl bg-error-500/10 text-center">
                        <p className="text-sm font-semibold text-error-400">{report.failed ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-400">Failed</p>
                      </div>
                      <div className="p-3 rounded-xl bg-warning-500/10 text-center">
                        <p className="text-sm font-semibold text-warning-400">{report.skipped ?? 0}</p>
                        <p className="text-[10px] uppercase text-slate-400">Skipped</p>
                      </div>
                    </div>
                    {report.total > 0 && (
                      <div className="w-full h-2 rounded-full bg-navy-150 overflow-hidden mb-2" aria-hidden="true">
                        <div
                          className="h-full bg-success-500"
                          style={{ width: `${Math.round(((report.passed ?? 0) / report.total) * 100)}%` }}
                        />
                      </div>
                    )}
                    <div className="mt-auto flex justify-between text-xs text-slate-500 pt-2 border-t border-navy-200/50">
                      <span>Duration</span>
                      <span>{report.duration_ms ? `${Math.round(report.duration_ms / 1000)}s` : "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Recorded</span>
                      <span>
                        {report.created_at ? new Date(report.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel label="Deployments" value="deployments">
          <div className="space-y-4">
            {deployments.length === 0 ? (
              <Card>
                <CardBody className="p-0">
                  <EmptyState
                    title="No deployments yet"
                    description="Deploy your project to see deployment history."
                  />
                </CardBody>
              </Card>
            ) : (
              <div className="rounded-xl border border-navy-200 bg-navy-100/50 divide-y divide-navy-200/50">
                {deployments.map((dep) => (
                  <div key={dep.id} className="p-4 flex items-start gap-4 hover:bg-navy-100/30 transition-colors">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                        dep.status === "success"
                          ? "bg-success-500/10 text-success-400"
                          : "bg-primary-500/10 text-primary-400"
                      }`}
                    >
                      <Server className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white capitalize">{dep.environment || "—"}</span>
                        <Badge status={dep.status} />
                      </div>
                      {dep.url && (
                        <a
                          href={dep.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-400 hover:text-primary-300 transition-colors truncate block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                        >
                          {dep.url}
                          <ExternalLink className="w-3 h-3 inline ml-1" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 flex-shrink-0">
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {dep.created_at ? new Date(dep.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {/* Delete confirmation — always requires an explicit confirm */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete project">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-slate-300">
            Are you sure you want to delete{" "}
            <strong className="text-white">&ldquo;{project.name || "Untitled project"}&rdquo;</strong>?
            This action cannot be undone.
          </p>
        </div>
        {deleteError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm"
          >
            {deleteError}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
