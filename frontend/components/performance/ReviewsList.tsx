'use client';

import { PerformanceReview } from '@/lib/performance/types';

interface ReviewsListProps {
  reviews: PerformanceReview[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number | undefined) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {review.cycle} Review
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Period: {new Date(review.periodStart).toLocaleDateString()} - {new Date(review.periodEnd).toLocaleDateString()}
              </p>
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                  {review.status.toUpperCase()}
                </span>
                {review.overallRating && (
                  <span className={`text-lg font-bold ${getRatingColor(review.overallRating)}`}>
                    ★ {review.overallRating.toFixed(1)}/5
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback */}
          {review.feedback && (
            <div className="bg-gray-50 rounded p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Feedback</h4>
              <div className="space-y-3">
                {review.feedback.strengths && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Strengths</p>
                    <p className="text-sm text-gray-600">{review.feedback.strengths}</p>
                  </div>
                )}
                {review.feedback.improvements && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Areas for Improvement</p>
                    <p className="text-sm text-gray-600">{review.feedback.improvements}</p>
                  </div>
                )}
                {review.feedback.summary && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Summary</p>
                    <p className="text-sm text-gray-600">{review.feedback.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Goals Snapshot */}
          {review.goalsSnapshot && review.goalsSnapshot.length > 0 && (
            <div className="bg-blue-50 rounded p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Reviewed Goals</h4>
              <div className="space-y-2">
                {review.goalsSnapshot.map((goal, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Goal {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div
                          className="bg-blue-600 h-2 rounded"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
