import { request } from "../api-client";
import type { AuthTokens } from "../auth/types";
import type {
  Employee,
  EmployeeListQuery,
  EmployeeListResponse,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "./types";

export const employeeApi = {
  /**
   * List employees with filters and pagination
   */
  async list(query: EmployeeListQuery, tokens: AuthTokens): Promise<EmployeeListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);
    if (query.department) params.append("department", query.department);
    if (query.status) params.append("status", query.status);
    if (query.employmentType) params.append("employmentType", query.employmentType);
    if (query.search) params.append("search", query.search);

    const queryString = params.toString();
    const path = `/employees${queryString ? `?${queryString}` : ""}`;

    return request<EmployeeListResponse>(path, {
      method: "GET",
      tokens,
    });
  },

  /**
   * Get employee by ID
   */
  async get(id: string, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}`, {
      method: "GET",
      tokens,
    });
  },

  /**
   * Create new employee
   */
  async create(payload: CreateEmployeePayload, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>("/employees", {
      method: "POST",
      body: payload,
      tokens,
    });
  },

  /**
   * Update employee
   */
  async update(id: string, payload: UpdateEmployeePayload, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}`, {
      method: "PUT",
      body: payload,
      tokens,
    });
  },

  /**
   * Delete employee
   */
  async delete(id: string, tokens: AuthTokens): Promise<void> {
    return request<void>(`/employees/${id}`, {
      method: "DELETE",
      tokens,
    });
  },

  /**
   * Set employee manager
   */
  async setManager(id: string, managerId: string, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}/manager`, {
      method: "POST",
      body: { managerId },
      tokens,
    });
  },

  /**
   * Terminate employee
   */
  async terminate(id: string, endDate: string, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}/terminate`, {
      method: "POST",
      body: { endDate },
      tokens,
    });
  },

  /**
   * Start employee onboarding
   */
  async startOnboarding(id: string, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}/onboarding/start`, {
      method: "POST",
      tokens,
    });
  },

  /**
   * Complete employee onboarding
   */
  async completeOnboarding(id: string, tokens: AuthTokens): Promise<Employee> {
    return request<Employee>(`/employees/${id}/onboarding/complete`, {
      method: "POST",
      tokens,
    });
  },
};
