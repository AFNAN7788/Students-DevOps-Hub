import { useState, useEffect } from "react";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";

const availableLanguages = ["JavaScript", "TypeScript", "Python", "Go", "Java", "C++", "Rust", "Ruby", "PHP", "Shell"];
const availableFrameworks = ["React", "Vue", "Angular", "Svelte", "Next.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot"];

// Accepts forms like github.com/octocat/repo as well as full https URLs.
function parseRepositoryUrl(rawUrl) {
  try {
    const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(withScheme);
    if (!/^(www\.)?github\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    return {
      repo_owner: segments[0], // first path segment, e.g. "octocat"
      repo_name: segments[1].replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

function isValidUrl(string) {
  try {
    new URL(/^https?:\/\//i.test(string) ? string : `https://${string}`);
    return true;
  } catch {
    return false;
  }
}

export default function ProjectForm({ initialData, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    repo_url: "",
    repo_owner: "",
    repo_name: "",
    default_branch: "main",
    language: "",
    framework: "",
    visibility: "private",
    ...(initialData || {}),
  });

  const [errors, setErrors] = useState({});

  // If initialData arrives late (async fetch), merge it in once.
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Auto-parse GitHub URL: owner = first path segment, name = second segment.
  useEffect(() => {
    if (!form.repo_url) return;
    const parsed = parseRepositoryUrl(form.repo_url);
    if (!parsed) return;
    if (parsed.repo_owner === form.repo_owner && parsed.repo_name === form.repo_name) return;
    setForm((prev) => ({ ...prev, ...parsed }));
  }, [form.repo_url]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Project name is required";
    if (!form.repo_url.trim()) newErrors.repo_url = "Repository URL is required";
    else if (!isValidUrl(form.repo_url)) newErrors.repo_url = "Please enter a valid URL";
    else if (!parseRepositoryUrl(form.repo_url))
      newErrors.repo_url = "Use a GitHub repository URL (github.com/owner/repo)";
    if (form.visibility !== "private" && form.visibility !== "public")
      newErrors.visibility = "Choose public or private";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Only submit fields the backend schema knows about.
      const { name, description, repo_url, repo_owner, repo_name, default_branch, language, framework, visibility } = form;
      onSubmit({
        name,
        description,
        repo_url,
        repo_owner,
        repo_name,
        default_branch: default_branch || "main",
        language,
        framework,
        visibility,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        <Input
          id="name"
          name="name"
          label="Project name"
          placeholder="My Awesome App"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input
          id="repo_url"
          name="repo_url"
          label="Repository URL"
          type="url"
          placeholder="https://github.com/username/repo"
          value={form.repo_url}
          onChange={handleChange}
          error={errors.repo_url}
          required
        />
        <Input
          id="default_branch"
          name="default_branch"
          label="Default branch"
          placeholder="main"
          value={form.default_branch}
          onChange={handleChange}
        />
        <Input
          id="repo_owner"
          name="repo_owner"
          label="Repo owner (auto-detected)"
          placeholder="owner"
          value={form.repo_owner}
          onChange={handleChange}
        />
        <Input
          id="repo_name"
          name="repo_name"
          label="Repo name (auto-detected)"
          placeholder="repository"
          value={form.repo_name}
          onChange={handleChange}
        />
        <Input
          id="visibility"
          name="visibility"
          label="Visibility"
          type="select"
          value={form.visibility}
          onChange={handleChange}
          error={errors.visibility}
          options={[
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]}
        />
      </div>

      {/* Language picker chips set the field value when clicked */}
      <div>
        <Input
          id="language"
          name="language"
          label="Primary language"
          placeholder="JavaScript, Python, Go..."
          value={form.language}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-1.5 -mt-2">
          <span className="text-[10px] uppercase text-slate-500 self-center">Common:</span>
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, language: lang }))}
              className={`px-2 py-0.5 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                form.language === lang
                  ? "bg-primary-500/20 text-primary-300"
                  : "bg-navy-200 text-slate-400 hover:bg-navy-100 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Input
          id="framework"
          name="framework"
          label="Framework"
          placeholder="React, Next.js, Django..."
          value={form.framework}
          onChange={handleChange}
        />
        <div className="flex flex-wrap gap-1.5 -mt-2">
          <span className="text-[10px] uppercase text-slate-500 self-center">Common:</span>
          {availableFrameworks.map((fw) => (
            <button
              key={fw}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, framework: fw }))}
              className={`px-2 py-0.5 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                form.framework === fw
                  ? "bg-primary-500/20 text-primary-300"
                  : "bg-navy-200 text-slate-400 hover:bg-navy-100 hover:text-white"
              }`}
            >
              {fw}
            </button>
          ))}
        </div>
      </div>

      <Input
        id="description"
        name="description"
        label="Description"
        placeholder="Describe your project..."
        value={form.description}
        onChange={handleChange}
        className="min-h-[100px]"
      />

      {form.repo_url && parseRepositoryUrl(form.repo_url) && (
        <div className="p-4 rounded-lg bg-navy-100/50 border border-navy-200/50">
          <p className="text-sm font-medium text-slate-400 mb-2">Auto-detected from URL:</p>
          <div className="flex items-center gap-2 flex-wrap">
            {form.repo_owner && <Badge label={form.repo_owner} status="active" />}
            {form.repo_name && <Badge label={form.repo_name} status="active" />}
            {form.default_branch && <Badge label={form.default_branch} status="pending" />}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-navy-200/50">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? "Update project" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
