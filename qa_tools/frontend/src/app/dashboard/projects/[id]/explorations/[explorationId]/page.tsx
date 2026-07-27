"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ExplorationStatus from "@/components/ExplorationStatus";
import { api } from "@/lib/api";

interface Exploration {
  id: string;
  status: string;
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  environment_id: string;
}

interface Page {
  id: string;
  url: string;
  title?: string;
  page_name?: string;
}

interface TestCase {
  id: string;
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  test_type: string;
  steps?: string[];
  expected_result?: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  created_at: string;
}

const PRIORITY_CONFIG = {
  HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  LOW: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const TYPE_ICONS: Record<string, string> = {
  FUNCTIONAL: "⚙️",
  UI: "🎨",
  ACCESSIBILITY: "♿",
  SECURITY: "🔒",
};

const STATUS_CONFIG = {
  DRAFT: "bg-gray-700 text-gray-300",
  APPROVED: "bg-green-500/10 text-green-400",
  REJECTED: "bg-red-500/10 text-red-400",
};

export default function ExplorationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const explorationId = params.explorationId as string;

  const [exploration, setExploration] = useState<Exploration | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [pollingActive, setPollingActive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [exp, pgs, tcs] = await Promise.all([
        api.getExploration(explorationId) as Promise<Exploration>,
        api.getPages(explorationId) as Promise<Page[]>,
        api.getTestCases(explorationId) as Promise<TestCase[]>,
      ]);
      setExploration(exp);
      setPages(pgs);
      setTestCases(tcs);

      // Stop polling if exploration is done
      if (["COMPLETED", "FAILED"].includes(exp.status)) {
        setPollingActive(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [explorationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling every 5s if exploration is running
  useEffect(() => {
    if (exploration?.status === "RUNNING" || pollingActive) {
      const interval = setInterval(() => loadData(), 5000);
      return () => clearInterval(interval);
    }
  }, [exploration?.status, pollingActive, loadData]);

  const handleGenerateTests = async () => {
    setGenerating(true);
    setGenerateError("");
    try {
      await api.generateTestCases(explorationId);
      // Poll for results
      setPollingActive(true);
      setTimeout(() => {
        loadData();
        setPollingActive(false);
      }, 3000);
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Delete all existing test cases and regenerate?")) return;
    await api.deleteAllTestCases(explorationId);
    await handleGenerateTests();
  };

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const updated = await api.updateTestCase(id, { status }) as TestCase;
      setTestCases((prev) => prev.map((tc) => (tc.id === id ? updated : tc)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTestCase = async (id: string) => {
    await api.deleteTestCase(id);
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
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

  const approved = testCases.filter((tc) => tc.status === "APPROVED").length;
  const rejected = testCases.filter((tc) => tc.status === "REJECTED").length;
  const draft = testCases.filter((tc) => tc.status === "DRAFT").length;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/dashboard/projects/${projectId}`} className="hover:text-white transition-colors">Project</Link>
          <span>/</span>
          <span className="text-white">Exploration</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">Exploration Results</h1>
              {exploration && (
                <ExplorationStatus status={exploration.status} progress={exploration.progress} />
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {pages.length} pages discovered • {testCases.length} test cases
            </p>
          </div>

          {/* Generate Tests Button */}
          {exploration?.status === "COMPLETED" && (
            <div className="flex gap-2">
              {testCases.length > 0 ? (
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🔄 Regenerate
                </button>
              ) : (
                <button
                  id="generate-tests-btn"
                  onClick={handleGenerateTests}
                  disabled={generating}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {generating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>✨</span>
                  )}
                  {generating ? "Generating..." : "Generate Test Cases with AI"}
                </button>
              )}
            </div>
          )}
        </div>

        {generateError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">
            {generateError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-base font-semibold text-white">
                  Discovered Pages
                  <span className="ml-2 text-xs font-normal text-gray-500">({pages.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                {pages.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    {exploration?.status === "RUNNING" ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span>Crawling in progress...</span>
                      </div>
                    ) : (
                      "No pages discovered"
                    )}
                  </div>
                ) : (
                  pages.map((page) => (
                    <div key={page.id} className="px-5 py-3">
                      <p className="text-white text-xs font-medium truncate">
                        {page.title || page.page_name || "Untitled"}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">{page.url}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Cases Panel */}
          <div className="lg:col-span-2">
            {testCases.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Draft", count: draft, color: "text-gray-400" },
                  { label: "Approved", count: approved, color: "text-green-400" },
                  { label: "Rejected", count: rejected, color: "text-red-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {testCases.length === 0 && exploration?.status === "COMPLETED" ? (
                <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-white font-medium">Ready to generate test cases</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click &quot;Generate Test Cases with AI&quot; to analyze {pages.length} discovered pages
                  </p>
                </div>
              ) : (
                testCases.map((tc) => (
                  <div
                    key={tc.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{TYPE_ICONS[tc.test_type] || "🧪"}</span>
                        <h3 className="text-white font-semibold text-sm">{tc.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_CONFIG[tc.priority]}`}>
                          {tc.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[tc.status]}`}>
                          {tc.status}
                        </span>
                      </div>
                    </div>

                    {tc.description && (
                      <p className="text-gray-400 text-xs mb-3">{tc.description}</p>
                    )}

                    {tc.steps && tc.steps.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Steps</p>
                        <ol className="space-y-1">
                          {tc.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-300">
                              <span className="text-violet-400 font-medium flex-shrink-0">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {tc.expected_result && (
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-gray-500 mb-0.5">Expected Result</p>
                        <p className="text-xs text-green-300">{tc.expected_result}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                      {tc.status !== "APPROVED" && (
                        <button
                          onClick={() => handleUpdateStatus(tc.id, "APPROVED")}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                        >
                          ✅ Approve
                        </button>
                      )}
                      {tc.status !== "REJECTED" && (
                        <button
                          onClick={() => handleUpdateStatus(tc.id, "REJECTED")}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          ❌ Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTestCase(tc.id)}
                        className="ml-auto text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
