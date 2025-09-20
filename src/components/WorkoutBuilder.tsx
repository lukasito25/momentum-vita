import React, { useState, useEffect } from 'react';
import { Plus, Save, X, ArrowLeft, Trash2, Copy, Users, Lock, Settings } from 'lucide-react';
import ExerciseLibrary from './ExerciseLibrary';
import {
  CustomWorkout,
  CustomWorkoutExercise,
  Exercise,
  WorkoutBuilderState,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  getWorkoutDuration,
  getWorkoutMuscleGroups,
  getWorkoutEquipment,
  calculateWorkoutDifficulty
} from '../types/ExerciseLibrary';
import { useAuth } from '../contexts/AuthContext';
import PremiumFeatureShowcase from './PremiumFeatureShowcase';

interface WorkoutBuilderProps {
  initialWorkout?: Partial<CustomWorkout>;
  onSave: (workout: CustomWorkout) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  initialWorkout,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const isPremium = isAuthenticated && user?.isPremium;
  const limits = isPremium ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;

  const [builderState, setBuilderState] = useState<WorkoutBuilderState>({
    currentWorkout: {
      name: '',
      description: '',
      exercises: [],
      tags: [],
      isPublic: false,
      isPremium: false,
      ...initialWorkout
    },
    selectedExercises: initialWorkout?.exercises || [],
    isEditing,
    draggedExercise: null,
    showExerciseLibrary: false,
    activeSuperset: null,
    unsavedChanges: false
  });

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentUserWorkouts, setCurrentUserWorkouts] = useState<CustomWorkout[]>([]);

  // Check if user has reached free tier limits
  const canAddMoreWorkouts = isPremium || currentUserWorkouts.length < limits.maxCustomWorkouts;
  const canAddMoreExercises = isPremium || builderState.selectedExercises.length < limits.maxExercisesPerWorkout;

  const updateWorkout = (updates: Partial<CustomWorkout>) => {
    setBuilderState(prev => ({
      ...prev,
      currentWorkout: { ...prev.currentWorkout, ...updates },
      unsavedChanges: true
    }));
  };

  const addExercise = (exercise: Exercise) => {
    if (!canAddMoreExercises) {
      setShowPremiumModal(true);
      return;
    }

    const newWorkoutExercise: CustomWorkoutExercise = {
      id: `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sets: exercise.defaultSets,
      targetReps: exercise.targetReps,
      restTime: exercise.restTime,
      order: builderState.selectedExercises.length,
      isSuperset: false
    };

    setBuilderState(prev => ({
      ...prev,
      selectedExercises: [...prev.selectedExercises, newWorkoutExercise],
      unsavedChanges: true
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setBuilderState(prev => ({
      ...prev,
      selectedExercises: prev.selectedExercises.filter(ex => ex.id !== exerciseId),
      unsavedChanges: true
    }));
  };

  const updateExercise = (exerciseId: string, updates: Partial<CustomWorkoutExercise>) => {
    setBuilderState(prev => ({
      ...prev,
      selectedExercises: prev.selectedExercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
      unsavedChanges: true
    }));
  };

  const reorderExercises = (startIndex: number, endIndex: number) => {
    const result = Array.from(builderState.selectedExercises);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update order property
    const reorderedExercises = result.map((ex, index) => ({ ...ex, order: index }));

    setBuilderState(prev => ({
      ...prev,
      selectedExercises: reorderedExercises,
      unsavedChanges: true
    }));
  };

  const createSuperset = (exerciseIds: string[]) => {
    if (!limits.supersetSupport) {
      setShowPremiumModal(true);
      return;
    }

    const supersetGroup = Math.max(
      ...builderState.selectedExercises.map(ex => ex.supersetGroup || 0)
    ) + 1;

    setBuilderState(prev => ({
      ...prev,
      selectedExercises: prev.selectedExercises.map(ex =>
        exerciseIds.includes(ex.id)
          ? { ...ex, isSuperset: true, supersetGroup }
          : ex
      ),
      unsavedChanges: true
    }));
  };

  const saveWorkout = async () => {
    if (!builderState.currentWorkout.name?.trim()) {
      alert('Please enter a workout name');
      return;
    }

    if (builderState.selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    if (!canAddMoreWorkouts && !isEditing) {
      setShowPremiumModal(true);
      return;
    }

    const workout: CustomWorkout = {
      id: builderState.currentWorkout.id || `workout-${Date.now()}`,
      name: builderState.currentWorkout.name,
      description: builderState.currentWorkout.description || '',
      exercises: builderState.selectedExercises,
      estimatedDuration: getWorkoutDuration(builderState.selectedExercises),
      difficulty: calculateWorkoutDifficulty(builderState.selectedExercises),
      tags: builderState.currentWorkout.tags || [],
      muscleGroups: getWorkoutMuscleGroups(builderState.selectedExercises),
      equipment: getWorkoutEquipment(builderState.selectedExercises),
      createdAt: builderState.currentWorkout.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: builderState.currentWorkout.isPublic || false,
      isPremium: isPremium && (builderState.currentWorkout.isPremium || false),
      createdBy: user?.id,
      likes: builderState.currentWorkout.likes || 0,
      uses: builderState.currentWorkout.uses || 0,
      notes: builderState.currentWorkout.notes
    };

    onSave(workout);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Cancel workout creation"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {isEditing ? 'Edit Workout' : 'Create Workout'}
              </h1>
              {!isPremium && (
                <p className="text-sm text-gray-600">
                  Free: {currentUserWorkouts.length}/{limits.maxCustomWorkouts} workouts
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {builderState.unsavedChanges && (
              <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
            )}
            <button
              onClick={saveWorkout}
              disabled={!builderState.currentWorkout.name || builderState.selectedExercises.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2"
              aria-label="Save workout"
            >
              <Save className="w-4 h-4" />
              Save Workout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Workout Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Workout Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workout Name *
              </label>
              <input
                type="text"
                value={builderState.currentWorkout.name || ''}
                onChange={(e) => updateWorkout({ name: e.target.value })}
                placeholder="Enter workout name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={builderState.currentWorkout.description || ''}
                onChange={(e) => updateWorkout({ description: e.target.value })}
                placeholder="Describe your workout..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={builderState.currentWorkout.isPublic || false}
                  onChange={(e) => updateWorkout({ isPublic: e.target.checked })}
                  disabled={!limits.workoutSharing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Make public
                  {!limits.workoutSharing && <Lock className="w-3 h-3 inline ml-1 text-gray-400" />}
                </span>
              </label>

              {isPremium && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={builderState.currentWorkout.isPremium || false}
                    onChange={(e) => updateWorkout({ isPremium: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Premium workout</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Exercises ({builderState.selectedExercises.length})
              {!isPremium && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  Max: {limits.maxExercisesPerWorkout}
                </span>
              )}
            </h2>

            <button
              onClick={() => setBuilderState(prev => ({ ...prev, showExerciseLibrary: true }))}
              disabled={!canAddMoreExercises}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add exercise"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>

          {builderState.selectedExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No exercises added</h3>
              <p className="text-gray-600 mb-4">Start building your workout by adding exercises</p>
              <button
                onClick={() => setBuilderState(prev => ({ ...prev, showExerciseLibrary: true }))}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Browse Exercise Library
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {builderState.selectedExercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onUpdate={(updates) => updateExercise(exercise.id, updates)}
                  onRemove={() => removeExercise(exercise.id)}
                  onMoveUp={() => index > 0 && reorderExercises(index, index - 1)}
                  onMoveDown={() => index < builderState.selectedExercises.length - 1 && reorderExercises(index, index + 1)}
                  canModify={limits.advancedModifications}
                  showPremiumUpgrade={() => setShowPremiumModal(true)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Workout Summary */}
        {builderState.selectedExercises.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Workout Summary</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getWorkoutDuration(builderState.selectedExercises)}
                </div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {builderState.selectedExercises.length}
                </div>
                <div className="text-sm text-gray-600">Exercises</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 capitalize">
                  {calculateWorkoutDifficulty(builderState.selectedExercises)}
                </div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {getWorkoutMuscleGroups(builderState.selectedExercises).length}
                </div>
                <div className="text-sm text-gray-600">Muscle Groups</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Library Modal */}
      {builderState.showExerciseLibrary && (
        <ExerciseLibrary
          isOpen={true}
          onClose={() => setBuilderState(prev => ({ ...prev, showExerciseLibrary: false }))}
          onExerciseSelect={addExercise}
          selectedExercises={builderState.selectedExercises.map(ex => ex.exerciseId)}
          showAddButton={true}
        />
      )}

      {/* Premium Feature Modal */}
      {showPremiumModal && (
        <PremiumFeatureShowcase
          feature="customization"
          onUpgrade={() => setShowPremiumModal(false)}
          onClose={() => setShowPremiumModal(false)}
        />
      )}
    </div>
  );
};

// Exercise Card Component
interface ExerciseCardProps {
  exercise: CustomWorkoutExercise;
  index: number;
  onUpdate: (updates: Partial<CustomWorkoutExercise>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canModify: boolean;
  showPremiumUpgrade: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canModify,
  showPremiumUpgrade
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{exercise.exercise.name}</h3>
              <p className="text-sm text-gray-600">
                {exercise.sets} sets × {exercise.targetReps} reps
                {exercise.weight && ` @ ${exercise.weight}kg`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Toggle exercise details"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
            aria-label="Remove exercise"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
              <input
                type="number"
                min="1"
                max="10"
                value={exercise.sets}
                onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Reps</label>
              <input
                type="text"
                value={exercise.targetReps}
                onChange={(e) => onUpdate({ targetReps: e.target.value })}
                placeholder="8-10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rest (sec)</label>
              <input
                type="number"
                min="0"
                max="600"
                step="15"
                value={exercise.restTime}
                onChange={(e) => onUpdate({ restTime: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={exercise.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Exercise-specific notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exercise.isSuperset || false}
                  onChange={(e) => {
                    if (!canModify && e.target.checked) {
                      showPremiumUpgrade();
                      return;
                    }
                    onUpdate({ isSuperset: e.target.checked });
                  }}
                  disabled={!canModify}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Superset
                  {!canModify && <Lock className="w-3 h-3 inline ml-1 text-gray-400" />}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                aria-label="Move exercise up"
              >
                ↑
              </button>

              <button
                onClick={onMoveDown}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                aria-label="Move exercise down"
              >
                ↓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutBuilder;