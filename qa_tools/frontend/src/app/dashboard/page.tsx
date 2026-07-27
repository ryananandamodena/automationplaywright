"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProjects();
  }, [router]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects() as Project[];
      setProjects(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("401")) {
        router.push("/login");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1 text-sm">Manage your QA testing projects</p>
          </div>
          <Link
            id="new-project-btn"
            href="/dashboard/projects/new"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Projects", value: projects.length, icon: "🗂️" },
            { label: "Active Projects", value: projects.filter((p) => p.status === "ACTIVE").length, icon: "✅" },
            { label: "Total Environments", value: "—", icon: "🌐" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Projects list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">Recent Projects</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center text-red-400 text-sm">{error}</div>
          ) : projects.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <p className="text-white font-medium">No projects yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center gap-2 mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Create Project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm group-hover:text-violet-300 transition-colors">
                        {project.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{project.application_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      project.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-gray-700 text-gray-400"
                    }`}>
                      {project.status}
                    </span>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
