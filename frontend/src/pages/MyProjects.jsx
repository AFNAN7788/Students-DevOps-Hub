import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  GitMerge,
  Package,
  Clock,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card, { CardBody, CardFooter } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { projectApi, getApiErrorMessage } from "../api/client.js";

const PAGE_SIZE = 9;

function ProjectCardSkeleton({ className = "" }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardBody className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="h-5 w-3/4 bg-navy-150 rounded" />
          <div className="h-5 w-12 bg-navy-150 rounded" />
        </div>
        <div className="h-3 w-1/2 bg-navy-150 rounded mb-2" />
        <div className="h-3 w-full bg-navy-150 rounded mb-3" />
        <div className="h-3 w-2/3 bg-navy-150 rounded" />
      </CardBody>
    </Card>
  );
}

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all", visibility: "all" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const load = async (opts = {}) => {
    const targetPage = opts.page ?? page;
    const targetSearch = opts.search;
    if (targetSearch !== undefined) setAppliedSearch(targetSearch);

    setLoading(true);
    setError("");
    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
        ...(targetSearch !== undefined && targetSearch ? { search: targetSearch } : {}),
        ...(activeFilterCount && filters.status !== "all" ? { status: filters.status } : {}),
        ...(activeFilterCount && filters.visibility !== "all" ? { visibility: filters.visibility } : {}),
      };
      const res = await projectApi.list(params);
      const data = res.data ?? res;
      setProjects(data.items || []);
      setPagination(
        data.pagination || { page: targetPage, totalPages: 1, total: (data.items || []).length }
      );
      setPage(targetPage);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load projects."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
  }, []);

  const applyFilters = (nextFilters, resetPage = true) => {
    const { status, visibility } = nextFilters;
    const count = (status !== "all" ? 1 : 0) + (visibility !== "all" ? 1 : 0);
    setFilters(nextFilters);
    setActiveFilterCount(count);
    setFilterOpen(false);
    load({ page: resetPage ? 1 : page });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load({ page: 1, search: searchTerm });
  };

  const resetFilters = () => {
    setFilters({ status: "all", visibility: "all" });
    setActiveFilterCount(0);
    setFilterOpen(false);
    load({ page: 1 });
  };

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await projectApi.delete(projectToDelete.id);
      closeDeleteModal();
      // Reload current page; if it became empty, step back a page.
      const remaining = projects.length - 1;
      if (remaining === 0 && page > 1) {
        load({ page: page - 1 });
      } else {
        load({ page });
      }
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && projects.length === 0 && !error) {
    return (
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        <div className="h-8 w-56 bg-navy-150 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {Array(6).fill(0).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My projects</h1>
          <p className="text-slate-400 mt-1">Manage and monitor all your projects</p>
        </div>
        <Link to="/projects/add">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add project
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <form onSubmit={handleSearch} className="flex items-center gap-3" role="search" aria-label="Search projects">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            name="search"
            aria-label="Search projects"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/30 text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
          />
        </div>
        <div className="relative">
          <Button variant="outline" size="md" type="button" onClick={() => setFilterOpen((p) => !p)} aria-expanded={filterOpen} aria-haspopup="dialog">
            <Filter className="w-4 h-4 mr-1" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {filterOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 z-30 bg-navy-100 border border-navy-200 rounded-xl shadow-elevated-lg animate-fade-in p-4 space-y-4">
              <div>
                <label htmlFor="filter-status" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/30 text-sm text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-visibility" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Visibility
                </label>
                <select
                  id="filter-visibility"
                  value={filters.visibility}
                  onChange={(e) => applyFilters({ ...filters, visibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/30 text-sm text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="all">All visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2 border-t border-navy-200/50">
                <Button variant="secondary" size="sm" className="flex-1" type="button" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>

      {error ? (
        <Card>
          <CardBody className="p-0">
            <EmptyState
              title="Couldn't load projects"
              description={error}
              action={
                <Button variant="primary" onClick={() => load({ page })}>
                  Try again
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardBody className="p-0">
            <EmptyState
              title={
                appliedSearch || activeFilterCount > 0 ? "No matching projects" : "No projects yet"
              }
              description={
                appliedSearch || activeFilterCount > 0
                  ? "Try a different search term or reset the filters."
                  : "Add your first project to start monitoring CI/CD pipelines."
              }
              action={
                appliedSearch || activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Link to="/projects/add">
                    <Button>Add project</Button>
                  </Link>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group h-full hover:border-primary-500/30 transition-all duration-200">
              <CardBody className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-200 text-primary-400 flex-shrink-0">
                      <GitMerge className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                        {project.name || "Untitled project"}
                      </h3>
                      {project.repo_owner && project.repo_name && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {project.repo_owner}/{project.repo_name}
                        </p>
                      )}
                    </Link>
                  </div>
                  <Badge status={project.status} className="flex-shrink-0" />
                </div>

                {project.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2 flex-grow">{project.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-navy-200/50 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {project.language && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" aria-hidden="true" />
                        {project.language}
                      </span>
                    )}
                    {project._count?.pipelines !== undefined && (
                      <span>{project._count.pipelines} pipelines</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </CardBody>
              <CardFooter className="border-t border-navy-200/50 flex justify-end gap-2 p-3">
                <Link to={`/projects/${project.id}/edit`}>
                  <Button variant="ghost" size="sm" aria-label={`Edit ${project.name || "project"}`}>
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteModal(project)}
                  aria-label={`Delete ${project.name || "project"}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-error-400" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Pagination — server-driven */}
          {pagination.totalPages > 1 && (
            <nav className="xl:col-span-3 flex items-center justify-between pt-2" aria-label="Pagination">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} project
                {pagination.total === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => load({ page: pagination.page - 1 })}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => load({ page: pagination.page + 1 })}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete project"
      >
        {projectToDelete && (
          <>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-slate-300">
                Are you sure you want to delete{" "}
                <strong className="text-white">&ldquo;{projectToDelete.name || "Untitled project"}&rdquo;</strong>?
                This action cannot be undone.
              </p>
            </div>
            {deleteError && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Delete
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
