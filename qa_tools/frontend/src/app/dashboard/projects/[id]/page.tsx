"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ExplorationStatus from "@/components/ExplorationStatus";
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

interface Environment {
  id: string;
  name: string;
  base_url: string;
  auth_username?: string;
}

interface Exploration {
  id: string;
  status: string;
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);

  // New environment form
  const [showEnvForm, setShowEnvForm] = useState(false);
  const [envName, setEnvName] = useState("");
  const [envUrl, setEnvUrl] = useState("");
  const [envUsername, setEnvUsername] = useState("");
  const [envPassword, setEnvPassword] = useState("");
  const [envLoading, setEnvLoading] = useState(false);

  // Run exploration
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [explorationLoading, setExplorationLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    try {
      const [proj, envs, exps] = await Promise.all([
        api.getProject(projectId) as Promise<Project>,
        api.getEnvironments(projectId) as Promise<Environment[]>,
        api.getExplorations(projectId) as Promise<Exploration[]>,
      ]);
      setProject(proj);
      setEnvironments(envs);
      setExplorations(exps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvLoading(true);
    try {
      await api.createEnvironment(projectId, {
        name: envName,
        base_url: envUrl,
        auth_username: envUsername || undefined,
        auth_password: envPassword || undefined,
      });
      setShowEnvForm(false);
      setEnvName(""); setEnvUrl(""); setEnvUsername(""); setEnvPassword("");
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setEnvLoading(false);
    }
  };

  const handleRunExploration = async () => {
    if (!selectedEnvId) return;
    setExplorationLoading(true);
    try {
      await api.createExploration(projectId, selectedEnvId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setExplorationLoading(false);
    }
  };

  const handleDeleteEnv = async (id: string) => {
    if (!confirm("Delete this environment?")) return;
    await api.deleteEnvironment(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <a href={project.application_url} target="_blank" rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 text-sm mt-1 inline-flex items-center gap-1 transition-colors">
              {project.application_url}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {project.description && (
              <p className="text-gray-400 text-sm mt-1">{project.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Environments */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">Environments</h2>
              <button
                id="add-env-btn"
                onClick={() => setShowEnvForm(!showEnvForm)}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {showEnvForm && (
              <form onSubmit={handleCreateEnv} className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 space-y-3">
                <input
                  type="text" value={envName} onChange={(e) => setEnvName(e.target.value)}
                  required placeholder="Environment name (e.g. Staging)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="url" value={envUrl} onChange={(e) => setEnvUrl(e.target.value)}
                  required placeholder="Base URL (https://staging.myapp.com)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="text" value={envUsername} onChange={(e) => setEnvUsername(e.target.value)}
                  placeholder="Auth username (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="password" value={envPassword} onChange={(e) => setEnvPassword(e.target.value)}
                  placeholder="Auth password (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEnvForm(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-2 text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={envLoading}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                    {envLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-gray-800">
              {environments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No environments yet</div>
              ) : (
                environments.map((env) => (
                  <div key={env.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-white text-sm font-medium">{env.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{env.base_url}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEnv(env.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Run Exploration */}
            {environments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/30">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Run Exploration</p>
                <div className="flex gap-2">
                  <select
                    value={selectedEnvId}
                    onChange={(e) => setSelectedEnvId(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select environment...</option>
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                  </select>
                  <button
                    id="run-exploration-btn"
                    onClick={handleRunExploration}
                    disabled={!selectedEnvId || explorationLoading}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {explorationLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Run
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Explorations */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">Explorations</h2>
              <button onClick={loadData} className="text-gray-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-gray-800">
              {explorations.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">
                  No explorations yet. Select an environment and click Run.
                </div>
              ) : (
                explorations.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/dashboard/projects/${projectId}/explorations/${exp.id}`}
                    className="block px-6 py-3.5 hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <ExplorationStatus status={exp.status} progress={exp.progress} />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          {new Date(exp.created_at).toLocaleDateString()}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {exp.status === "RUNNING" && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${exp.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {exp.status === "COMPLETED" && (
                      <p className="text-xs text-gray-500 mt-1">Click to view pages & generate test cases →</p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
