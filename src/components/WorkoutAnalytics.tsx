import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Award,
  Calendar,
  User,
  Activity,
  Star
} from 'lucide-react';
import { ExerciseSetTracking, WorkoutSessionData } from '../types/SetTracking';

interface WorkoutAnalyticsProps {
  exerciseData: Record<string, ExerciseSetTracking>;
  sessionData?: WorkoutSessionData;
  weekNumber: number;
  phase: string;
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}

const WorkoutAnalytics: React.FC<WorkoutAnalyticsProps> = ({
  exerciseData,
  sessionData,
  weekNumber,
  phase
}) => {
  // Calculate analytics metrics
  const calculateMetrics = (): AnalyticsMetric[] => {
    const exercises = Object.values(exerciseData);
    const allSets = exercises.flatMap(ex => ex.sets);
    const completedSets = allSets.filter(set => set.completed);

    // Total Volume (weight × reps)
    const totalVolume = completedSets.reduce((sum, set) =>
      sum + (set.weight * (set.reps || 0)), 0
    );

    // Average RPE
    const setsWithRPE = completedSets.filter(set => set.rpe);
    const averageRPE = setsWithRPE.length > 0
      ? setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRPE.length
      : 0;

    // Average Weight
    const averageWeight = completedSets.length > 0
      ? completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length
      : 0;

    // Total Reps
    const totalReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0);

    // Completion Rate
    const completionRate = allSets.length > 0
      ? Math.round((completedSets.length / allSets.length) * 100)
      : 0;

    // Average Set Duration
    const setsWithDuration = completedSets.filter(set => set.duration);
    const averageDuration = setsWithDuration.length > 0
      ? setsWithDuration.reduce((sum, set) => sum + (set.duration || 0), 0) / setsWithDuration.length
      : 0;

    // Consistency Score (based on RPE variance)
    const rpeVariance = setsWithRPE.length > 1
      ? setsWithRPE.reduce((sum, set) => {
          const diff = (set.rpe || 0) - averageRPE;
          return sum + (diff * diff);
        }, 0) / setsWithRPE.length
      : 0;
    const consistencyScore = Math.max(0, 100 - (rpeVariance * 10));

    // Strength Progress (simplified - would compare to previous weeks)
    const strengthProgress = 2.5; // Placeholder - would be calculated from historical data

    return [
      {
        label: 'Total Volume',
        value: Math.round(totalVolume),
        unit: 'kg',
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'bg-blue-500',
        change: 8.5
      },
      {
        label: 'Average RPE',
        value: averageRPE.toFixed(1),
        icon: <Activity className="w-5 h-5" />,
        color: 'bg-orange-500',
        change: -0.3
      },
      {
        label: 'Completion Rate',
        value: completionRate,
        unit: '%',
        icon: <Target className="w-5 h-5" />,
        color: 'bg-green-500',
        change: 5.2
      },
      {
        label: 'Avg Weight',
        value: Math.round(averageWeight),
        unit: 'kg',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-purple-500',
        change: 4.1
      },
      {
        label: 'Total Reps',
        value: totalReps,
        icon: <Zap className="w-5 h-5" />,
        color: 'bg-yellow-500'
      },
      {
        label: 'Avg Set Time',
        value: Math.round(averageDuration),
        unit: 's',
        icon: <Clock className="w-5 h-5" />,
        color: 'bg-indigo-500'
      },
      {
        label: 'Consistency',
        value: Math.round(consistencyScore),
        unit: '%',
        icon: <Star className="w-5 h-5" />,
        color: 'bg-pink-500',
        change: 2.1
      },
      {
        label: 'Strength Gain',
        value: strengthProgress,
        unit: '%',
        icon: <Award className="w-5 h-5" />,
        color: 'bg-emerald-500',
        change: 1.8
      }
    ];
  };

  const metrics = calculateMetrics();
  const exercises = Object.values(exerciseData);

  // Performance insights
  const getInsights = (): string[] => {
    const insights: string[] = [];
    const completedSets = exercises.flatMap(ex => ex.sets).filter(set => set.completed);

    if (completedSets.length === 0) {
      return ['Start tracking sets to get personalized insights!'];
    }

    const averageRPE = completedSets.filter(set => set.rpe).reduce((sum, set) => sum + (set.rpe || 0), 0) / completedSets.filter(set => set.rpe).length;
    const completionRate = (completedSets.length / exercises.flatMap(ex => ex.sets).length) * 100;

    if (averageRPE > 8.5) {
      insights.push('Your average RPE is high - consider reducing weight slightly for better form');
    } else if (averageRPE < 6) {
      insights.push('Your RPE is low - you can likely increase the weight for better gains');
    } else {
      insights.push('Great intensity! Your RPE range is optimal for strength gains');
    }

    if (completionRate > 90) {
      insights.push('Excellent consistency! You\'re completing almost all planned sets');
    } else if (completionRate < 70) {
      insights.push('Try to complete more sets for better results - consistency is key');
    }

    insights.push(`You're in the ${phase} phase - focus on progressive overload`);

    if (weekNumber > 4) {
      insights.push('Great progress through multiple weeks! Track your strength gains');
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Workout Analytics</h3>
            <p className="text-sm text-gray-600">Week {weekNumber} • {phase} Phase</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold">Live Data</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 ${metric.color} rounded-lg shadow-sm`}>
                <div className="text-white">
                  {metric.icon}
                </div>
              </div>
              {metric.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  metric.change > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${metric.change < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {metric.value}
              {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
            </div>
            <div className="text-xs text-gray-600 font-medium">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Exercise Breakdown */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Exercise Performance
        </h4>
        <div className="space-y-3">
          {exercises.map((exercise, index) => {
            const completedSets = exercise.sets.filter(set => set.completed).length;
            const totalSets = exercise.sets.length;
            const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
            const averageWeight = exercise.sets.length > 0
              ? exercise.sets.reduce((sum, set) => sum + set.weight, 0) / exercise.sets.length
              : 0;

            return (
              <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 text-sm">{exercise.exerciseName}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{completedSets}/{totalSets} sets</span>
                    <span>{Math.round(averageWeight)}kg avg</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Performance Insights
        </h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            View Detailed Stats
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Progress Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium">
            <Target className="w-4 h-4" />
            Set Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutAnalytics;