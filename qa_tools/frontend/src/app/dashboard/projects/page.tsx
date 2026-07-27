"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface Project {
  id: string;
  name: string;
  description?: string;
  application_url: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.getProjects()
      .then((data) => setProjects(data as Project[]))
      .catch((err: unknown) => {
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load projects");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.application_url.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            id="create-project-link"
            href="/dashboard/projects/new"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-projects"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-16">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-gray-900 border border-gray-800 rounded-xl">
            {search ? (
              <>
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-white font-medium">No projects match &quot;{search}&quot;</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">🚀</div>
                <p className="text-white font-medium">No projects yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex items-center gap-2 mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Create Project
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-500/50 hover:bg-gray-800/50 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm group-hover:text-violet-300 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{project.application_url}</p>
                  </div>
                </div>

                {project.description && (
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === "ACTIVE"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {new Date(project.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
