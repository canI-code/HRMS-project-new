'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { performanceApi } from '@/lib/performance/api';
import { PerformanceReview } from '@/lib/performance/types';

interface CreateReviewDialogProps {
  onClose: () => void;
  onReviewCreated: (review: PerformanceReview) => void;
}

export default function CreateReviewDialog({ onClose, onReviewCreated }: CreateReviewDialogProps) {
  const { tokens, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cycle: '',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokens || !user) {
      setError('Authentication required');
      return;
    }

    if (!formData.cycle.trim()) {
      setError('Review cycle is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        revieweeId: user.userId,
        reviewerId: user.userId,
        cycle: formData.cycle,
        periodStart: new Date(formData.periodStart).toISOString(),
        periodEnd: new Date(formData.periodEnd).toISOString(),
      };

      const review = await performanceApi.createReview(payload, tokens);
      onReviewCreated(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create review');
      console.error('Error creating review:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Performance Review</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Cycle *</label>
              <input
                type="text"
                value={formData.cycle}
                onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                placeholder="e.g., Q1 2024, Annual 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
              <input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
              <input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-gray-500 mt-4">
              You can add goals and detailed feedback in the next step.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
