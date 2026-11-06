import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import Card, { CardBody } from "../components/ui/Card.jsx";
import ProjectForm from "../components/forms/ProjectForm.jsx";
import { projectApi, getApiErrorMessage } from "../api/client.js";

export default function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const res = await projectApi.create(payload);
      const created = res.data ?? res;
      navigate(created?.id ? `/projects/${created.id}` : "/projects");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create project. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1 inline" aria-hidden="true" /> Back to projects
        </Link>
      </div>

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
                <Plus className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Add a new project</h2>
            </div>
            <p className="text-slate-400 text-sm max-w-lg">
              Connect your GitHub repository to start monitoring CI/CD builds, tests, and deployments.
            </p>
          </div>

          <ProjectForm
            onSubmit={handleSubmit}
            loading={loading}
            onCancel={() => navigate("/projects")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
