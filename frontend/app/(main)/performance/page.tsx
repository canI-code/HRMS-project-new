'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { performanceApi } from '@/lib/performance/api';
import { PerformanceGoal, PerformanceReview } from '@/lib/performance/types';
import GoalsList from '@/components/performance/GoalsList';
import ReviewsList from '@/components/performance/ReviewsList';
import CreateGoalDialog from '@/components/performance/CreateGoalDialog';
import CreateReviewDialog from '@/components/performance/CreateReviewDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function PerformancePage() {
  const { state } = useAuth();
  const tokens = state.tokens;
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');

  useEffect(() => {
    if (tokens) {
      loadData();
    }
  }, [tokens]);

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

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Performance Management</h1>
        <p className="text-muted-foreground">Track your goals and performance reviews</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'goals' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('goals')}
          className="rounded-b-none"
        >
          Goals ({goals.length})
        </Button>
        <Button
          variant={activeTab === 'reviews' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reviews')}
          className="rounded-b-none"
        >
          Reviews ({reviews.length})
        </Button>
      </div>

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performance Goals</h2>
            <Button onClick={() => setShowGoalDialog(true)}>Create Goal</Button>
          </div>
          <GoalsList goals={goals} onGoalUpdated={loadData} />
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performance Reviews</h2>
            <Button onClick={() => setShowReviewDialog(true)}>Create Review</Button>
          </div>
          <ReviewsList reviews={reviews} />
        </div>
      )}

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
