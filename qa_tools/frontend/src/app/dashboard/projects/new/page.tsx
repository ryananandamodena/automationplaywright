"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const project = await api.createProject({
        name,
        description: description || undefined,
        application_url: applicationUrl,
      }) as { id: string };
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">New Project</h1>
          <p className="text-gray-400 mt-1 text-sm">Add a web application to start automated QA testing</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name *</label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. My E-Commerce App"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of this project..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Application URL *</label>
              <input
                id="project-url"
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                required
                placeholder="https://myapp.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                id="create-project-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
