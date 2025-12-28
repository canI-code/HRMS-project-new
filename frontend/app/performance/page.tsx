'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { performanceApi } from '@/lib/performance/api';
import { PerformanceGoal, PerformanceReview } from '@/lib/performance/types';
import GoalsList from '@/components/performance/GoalsList';
import ReviewsList from '@/components/performance/ReviewsList';
import CreateGoalDialog from '@/components/performance/CreateGoalDialog';
import CreateReviewDialog from '@/components/performance/CreateReviewDialog';

export default function PerformancePage() {
  const { tokens, user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');

  useEffect(() => {
    if (!authLoading && tokens) {
      loadData();
    }
  }, [authLoading, tokens]);

  const loadData = async () => {
    if (!tokens) return;

    try {
      setLoading(true);
      setError(null);

      const [goalsData, reviewsData] = await Promise.all([
        performanceApi.listMyGoals(tokens),
        performanceApi.listMyReviews(tokens),
      ]);

      setGoals(goalsData);
      setReviews(reviewsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalCreated = (newGoal: PerformanceGoal) => {
    setGoals([...goals, newGoal]);
    setShowGoalDialog(false);
  };

  const handleReviewCreated = (newReview: PerformanceReview) => {
    setReviews([...reviews, newReview]);
    setShowReviewDialog(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Management</h1>
          <p className="text-gray-600">Track your goals and performance reviews</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('goals')}
              className={`pb-4 font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Goals ({goals.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'goals' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Performance Goals</h2>
                <button
                  onClick={() => setShowGoalDialog(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Goal
                </button>
              </div>
              <GoalsList goals={goals} onGoalUpdated={loadData} />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Performance Reviews</h2>
                <button
                  onClick={() => setShowReviewDialog(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Review
                </button>
              </div>
              <ReviewsList reviews={reviews} />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showGoalDialog && (
        <CreateGoalDialog
          onClose={() => setShowGoalDialog(false)}
          onGoalCreated={handleGoalCreated}
        />
      )}

      {showReviewDialog && (
        <CreateReviewDialog
          onClose={() => setShowReviewDialog(false)}
          onReviewCreated={handleReviewCreated}
        />
      )}
    </div>
  );
}
