import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProjectForm from "../components/forms/ProjectForm.jsx";
import { projectApi, getApiErrorMessage } from "../api/client.js";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loadState, setLoadState] = useState({ status: "loading", error: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading", error: "" });
    projectApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setProject((res.data ?? res) || null);
        setLoadState({ status: "ready", error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err?.response?.status;
        setLoadState({
          status: code === 404 ? "not-found" : "error",
          error: getApiErrorMessage(err, "Failed to load the project."),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await projectApi.update(id, payload);
      const updated = res.data ?? res;
      navigate(updated?.id ? `/projects/${updated.id}` : `/projects/${id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update project. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={project ? `/projects/${id}` : "/projects"}
          className="text-sm text-slate-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 inline" aria-hidden="true" />
          {project ? "Back to project" : "Back to projects"}
        </Link>
      </div>

      {loadState.status === "loading" && (
        <Card>
          <CardBody className="p-6 sm:p-8 space-y-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardBody>
        </Card>
      )}

      {loadState.status === "not-found" && (
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
      )}

      {loadState.status === "error" && (
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
      )}

      {loadState.status === "ready" && project && (
        <>
          {error && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-error-500/10 border border-error-500/20 flex items-start gap-3 text-error-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Card>
            <CardBody className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-400">
                    <Pencil className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Edit {project.name || "project"}
                  </h2>
                </div>
                <p className="text-slate-400 text-sm max-w-lg">
                  Update your project details. Changes are saved to the backend when you submit.
                </p>
              </div>

              <ProjectForm
                initialData={project}
                onSubmit={handleSubmit}
                loading={loading}
                onCancel={() => navigate(`/projects/${id}`)}
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
