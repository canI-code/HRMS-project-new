'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { performanceApi } from '@/lib/performance/api';
import { PerformanceGoal } from '@/lib/performance/types';
import { useState } from 'react';

interface GoalsListProps {
  goals: PerformanceGoal[];
  onGoalUpdated: () => void;
}

export default function GoalsList({ goals, onGoalUpdated }: GoalsListProps) {
  const { tokens } = useAuth();
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);

  const handleProgressUpdate = async (goalId: string, delta: number) => {
    if (!tokens) return;

    try {
      setUpdatingGoalId(goalId);
      await performanceApi.updateGoalProgress(goalId, { delta }, tokens);
      onGoalUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update progress');
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No goals yet. Create your first goal to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.title}</h3>
              {goal.description && (
                <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
              )}
              <div className="flex gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status.replace('_', ' ').toUpperCase()}
                </span>
                {goal.dueDate && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(goal.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics */}
          {goal.metrics && goal.metrics.length > 0 && (
            <div className="mb-4 bg-gray-50 rounded p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goal.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-gray-100">
                    <p className="text-sm font-medium text-gray-900 mb-1">{metric.name}</p>
                    <p className="text-xs text-gray-600">
                      {metric.current} / {metric.target} {metric.unit || ''}
                    </p>
                    <div className="w-full bg-gray-200 rounded h-1 mt-2">
                      <div
                        className="bg-green-600 h-1 rounded"
                        style={{ width: `${(metric.current / metric.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {goal.status !== 'completed' && goal.status !== 'archived' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleProgressUpdate(goal._id, -5)}
                disabled={updatingGoalId === goal._id || goal.progress === 0}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                -5%
              </button>
              <button
                onClick={() => handleProgressUpdate(goal._id, 5)}
                disabled={updatingGoalId === goal._id || goal.progress === 100}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                +5%
              </button>
              <button
                onClick={() => handleProgressUpdate(goal._id, 25)}
                disabled={updatingGoalId === goal._id || goal.progress === 100}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                +25%
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
