const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return {} as T;
  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(error.detail || "Login failed");
      }
      return res.json();
    });
  },

  register: (email: string, password: string, role = "QA_ENGINEER") =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  // Projects
  getProjects: () => request("/projects/"),
  getProject: (id: string) => request(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; application_url: string }) =>
    request("/projects/", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: string, data: object) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: "DELETE" }),

  // Environments
  getEnvironments: (projectId: string) =>
    request(`/projects/${projectId}/environments`),
  createEnvironment: (projectId: string, data: { name: string; base_url: string; auth_username?: string; auth_password?: string }) =>
    request(`/projects/${projectId}/environments`, {
      method: "POST",
      body: JSON.stringify({ ...data, project_id: projectId }),
    }),
  deleteEnvironment: (id: string) =>
    request(`/environments/${id}`, { method: "DELETE" }),

  // Explorations
  getExplorations: (projectId: string) =>
    request(`/projects/${projectId}/explorations`),
  getExploration: (id: string) => request(`/explorations/${id}`),
  createExploration: (projectId: string, environmentId: string) =>
    request(`/explorations`, {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, environment_id: environmentId }),
    }),
  deleteExploration: (id: string) =>
    request(`/explorations/${id}`, { method: "DELETE" }),

  // Pages
  getPages: (explorationId: string) =>
    request(`/explorations/${explorationId}/pages`),

  // Test Cases
  getTestCases: (explorationId: string) =>
    request(`/explorations/${explorationId}/test-cases`),
  generateTestCases: (explorationId: string) =>
    request(`/explorations/${explorationId}/generate-tests`, { method: "POST" }),
  updateTestCase: (id: string, data: { status?: string; title?: string; priority?: string }) =>
    request(`/test-cases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTestCase: (id: string) =>
    request(`/test-cases/${id}`, { method: "DELETE" }),
  deleteAllTestCases: (explorationId: string) =>
    request(`/explorations/${explorationId}/test-cases`, { method: "DELETE" }),
};
