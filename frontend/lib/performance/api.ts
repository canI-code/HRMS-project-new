import { AuthTokens } from '@/lib/auth/types';
import {
  PerformanceGoal,
  PerformanceReview,
  CreateGoalPayload,
  UpdateGoalProgressPayload,
  CreateReviewPayload,
  CompleteReviewPayload,
} from './types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

export const performanceApi = {
  // Goals
  async createGoal(payload: CreateGoalPayload, tokens: AuthTokens): Promise<PerformanceGoal> {
    const response = await fetch(`${API_BASE_URL}/performance/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create goal');
    }

    return response.json();
  },

  async getGoal(goalId: string, tokens: AuthTokens): Promise<PerformanceGoal> {
    const response = await fetch(`${API_BASE_URL}/performance/goals/${goalId}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goal');
    }

    return response.json();
  },

  async listMyGoals(tokens: AuthTokens): Promise<PerformanceGoal[]> {
    const response = await fetch(`${API_BASE_URL}/performance/goals/my`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goals');
    }

    return response.json();
  },

  async listGoals(organizationId: string, tokens: AuthTokens): Promise<PerformanceGoal[]> {
    const response = await fetch(`${API_BASE_URL}/performance/goals`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goals');
    }

    return response.json();
  },

  async updateGoalProgress(
    goalId: string,
    payload: UpdateGoalProgressPayload,
    tokens: AuthTokens
  ): Promise<PerformanceGoal> {
    const response = await fetch(`${API_BASE_URL}/performance/goals/${goalId}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update goal progress');
    }

    return response.json();
  },

  // Reviews
  async createReview(payload: CreateReviewPayload, tokens: AuthTokens): Promise<PerformanceReview> {
    const response = await fetch(`${API_BASE_URL}/performance/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    return response.json();
  },

  async getReview(reviewId: string, tokens: AuthTokens): Promise<PerformanceReview> {
    const response = await fetch(`${API_BASE_URL}/performance/reviews/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch review');
    }

    return response.json();
  },

  async listMyReviews(tokens: AuthTokens): Promise<PerformanceReview[]> {
    const response = await fetch(`${API_BASE_URL}/performance/reviews/my`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch reviews');
    }

    return response.json();
  },

  async listReviews(tokens: AuthTokens): Promise<PerformanceReview[]> {
    const response = await fetch(`${API_BASE_URL}/performance/reviews`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch reviews');
    }

    return response.json();
  },

  async completeReview(
    reviewId: string,
    payload: CompleteReviewPayload,
    tokens: AuthTokens
  ): Promise<PerformanceReview> {
    const response = await fetch(`${API_BASE_URL}/performance/reviews/${reviewId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete review');
    }

    return response.json();
  },
};
