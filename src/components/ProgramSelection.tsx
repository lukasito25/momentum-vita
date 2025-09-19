import { useState, useEffect } from "react";
import { Star, Lock, Crown, Trophy, TrendingUp, Clock, Users, Target, CheckCircle, ArrowRight } from "lucide-react";
import { DatabaseService, TrainingProgram, UserProgress } from '../lib/supabase';
import InstallButton from './InstallButton';

interface ProgramSelectionProps {
  onProgramSelect: (programId: string) => void;
  currentProgramId?: string;
  isAuthenticated?: boolean;
  onAuthRequired?: (programId: string) => void;
}

const ProgramSelection = ({ onProgramSelect, currentProgramId, isAuthenticated = false, onAuthRequired }: ProgramSelectionProps) => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [programsData, progressData] = await Promise.all([
        DatabaseService.getAvailablePrograms(),
        DatabaseService.getUserProgress()
      ]);

      setPrograms(programsData);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error loading program data:', error);
      // If database fails, use fallback programs and create fallback user progress
      setUserProgress({
        id: 'fallback-user',
        user_id: 'fallback-user',
        current_program_id: 'foundation-builder',
        current_week: 1,
        completed_exercises: {},
        exercise_weights: {},
        nutrition_goals: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setPrograms([
        {
          id: 'foundation-builder',
          name: 'Foundation Builder',
          description: '12-week beginner program focusing on building proper form and movement patterns with ARM specialization',
          duration_weeks: 12,
          difficulty_level: 'beginner',
          tags: ['beginner', 'strength', 'form', 'arms'],
          is_premium: false,
          workout_structure: {
            phases: {
              foundation: {
                name: "Foundation Phase",
                description: "Building movement patterns and base strength",
                color: "#3B82F6",
                weeks: [1, 2, 3, 4]
              },
              growth: {
                name: "Growth Phase",
                description: "Increasing volume for muscle development",
                color: "#10B981",
                weeks: [5, 6, 7, 8]
              },
              intensity: {
                name: "Intensity Phase",
                description: "Advanced techniques and peak strength",
                color: "#F59E0B",
                weeks: [9, 10, 11, 12]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        },
        {
          id: 'power-surge-pro',
          name: 'Power Surge Pro',
          description: '16-week intermediate program for explosive power and strength gains with advanced techniques',
          duration_weeks: 16,
          difficulty_level: 'intermediate',
          tags: ['intermediate', 'power', 'strength', 'explosive'],
          is_premium: true, // Premium program - requires authentication
          workout_structure: {
            phases: {
              build: {
                name: "Power Build Phase",
                description: "Building explosive power foundation",
                color: "#8B5CF6",
                weeks: [1, 2, 3, 4]
              },
              surge: {
                name: "Strength Surge Phase",
                description: "Increasing load capacity and raw strength",
                color: "#EF4444",
                weeks: [5, 6, 7, 8]
              },
              peak: {
                name: "Power Peak Phase",
                description: "Maximum power output with plyometrics",
                color: "#F97316",
                weeks: [9, 10, 11, 12]
              },
              elite: {
                name: "Elite Conditioning Phase",
                description: "Peak performance with advanced techniques",
                color: "#DC2626",
                weeks: [13, 14, 15, 16]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        },
        {
          id: 'beast-mode-elite',
          name: 'Beast Mode Elite',
          description: '20-week advanced program for elite athletes seeking maximum performance and competition-prep training',
          duration_weeks: 20,
          difficulty_level: 'advanced',
          tags: ['advanced', 'elite', 'competition', 'maximum'],
          is_premium: true, // Premium program - requires authentication
          workout_structure: {
            phases: {
              foundation: {
                name: "Beast Foundation Phase",
                description: "Advanced movement preparation",
                color: "#7C2D12",
                weeks: [1, 2, 3, 4]
              },
              dominance: {
                name: "Power Dominance Phase",
                description: "Olympic lifts and maximum power",
                color: "#991B1B",
                weeks: [5, 6, 7, 8]
              },
              supremacy: {
                name: "Strength Supremacy Phase",
                description: "Powerlifting methodology",
                color: "#1F2937",
                weeks: [9, 10, 11, 12]
              },
              warfare: {
                name: "Hypertrophy Warfare Phase",
                description: "Advanced muscle building techniques",
                color: "#0F172A",
                weeks: [13, 14, 15, 16]
              },
              mastery: {
                name: "Elite Mastery Phase",
                description: "Peak performance integration",
                color: "#000000",
                weeks: [17, 18, 19, 20]
              }
            },
            workouts: {},
            nutrition_goals: []
          }
        }
      ]);
      setUserProgress({
        current_level: 1,
        total_xp: 0,
        current_program_id: 'foundation-builder',
        current_week: 1,
        programs_completed: [],
        achievements_unlocked: []
      });
    } finally {
      setLoading(false);
    }
  };

  const isProgramUnlocked = (program: TrainingProgram): boolean => {
    // Foundation Builder is always free
    if (!program.is_premium) return true;

    // Premium programs require authentication AND premium status
    return isAuthenticated;
  };

  const hasPremiumAccess = (): boolean => {
    // For now, return true for authenticated users since we're in demo mode
    // In production, this would check user?.isPremium
    return isAuthenticated;
  };

  const getProgressPercentage = (program: TrainingProgram): number => {
    if (!userProgress) return 0;
    if (program.id !== currentProgramId) {
      // Show progress for completed programs
      if (userProgress.programs_completed.includes(program.id)) return 100;
      return 0;
    }
    return Math.round((userProgress.current_week / program.duration_weeks) * 100);
  };

  const isProgramCompleted = (program: TrainingProgram): boolean => {
    return userProgress?.programs_completed.includes(program.id) || false;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-4 h-4" />;
      case 'intermediate': return <TrendingUp className="w-4 h-4" />;
      case 'advanced': return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCardGradient = (program: TrainingProgram) => {
    if (program.id === currentProgramId) {
      return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700';
    }

    switch (program.difficulty_level) {
      case 'beginner':
        return 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-700';
      case 'intermediate':
        return 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700';
      case 'advanced':
        return 'bg-gradient-to-br from-red-500 via-red-600 to-red-700';
      default:
        return 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700';
    }
  };

  const getFeatures = (program: TrainingProgram) => {
    switch (program.id) {
      case 'foundation-builder':
        return [
          'Perfect form development',
          'Progressive overload basics',
          'ARM specialization focus',
          'Nutrition guidance included'
        ];
      case 'power-surge-pro':
        return [
          'Explosive power training',
          'Advanced compound movements',
          'Olympic lift variations',
          'Peak performance protocols'
        ];
      case 'beast-mode-elite':
        return [
          'Elite athlete protocols',
          'Maximum intensity training',
          'Advanced periodization',
          'Competition preparation'
        ];
      default:
        return [];
    }
  };

  const getProgramImageCategory = (programId: string): 'foundation' | 'growth' | 'intensity' => {
    switch (programId) {
      case 'foundation-builder':
        return 'foundation';
      case 'power-surge-pro':
        return 'growth';
      case 'beast-mode-elite':
        return 'intensity';
      default:
        return 'foundation';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading training programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky pwa-sticky-header z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 pwa-header">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <InstallButton />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Training Program</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select the perfect training program for your fitness level and goals.
              Each program is designed to challenge you and deliver real results.
            </p>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {programs.map((program) => {
            const isUnlocked = isProgramUnlocked(program);
            const isCurrent = program.id === currentProgramId;
            const isCompleted = isProgramCompleted(program);
            const progressPercent = getProgressPercentage(program);
            const features = getFeatures(program);

            return (
              <div
                key={program.id}
                className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl sm:transform sm:hover:scale-105 cursor-pointer ${isCompleted ? 'ring-2 ring-green-400 ring-opacity-50' : ''} min-h-[600px] sm:min-h-[650px]`}
                onClick={() => {
                  if (isUnlocked) {
                    onProgramSelect(program.id);
                  } else if (program.is_premium && !isAuthenticated && onAuthRequired) {
                    onAuthRequired(program.id);
                  }
                }}
              >
                {/* Card Header with Background Image */}
                <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 ${getCardGradient(program)} opacity-90`}></div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-6 text-white flex flex-col justify-between">
                    {/* Top Section with Badges */}
                    <div className="flex justify-between items-start">
                      {/* Left Badges */}
                      <div className="space-y-2">
                        {/* Current Program Badge */}
                        {isCurrent && (
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                            <CheckCircle className="w-3 h-3" />
                            Current Program
                          </div>
                        )}

                        {/* Completed Program Badge */}
                        {isCompleted && !isCurrent && (
                          <div className="bg-green-500 bg-opacity-90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                            <Trophy className="w-3 h-3" />
                            Completed
                          </div>
                        )}
                      </div>

                      {/* Right Badges */}
                      <div className="space-y-2">
                        {/* Premium Badge */}
                        {program.is_premium && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg">
                            <Crown className="w-5 h-5" />
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Bottom Section with Program Info */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold drop-shadow-lg leading-tight">{program.name}</h3>
                        <p className="text-xs sm:text-sm opacity-95 leading-relaxed drop-shadow-md bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 sm:p-3 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '4.5rem'
                        }}>
                          {program.description}
                        </p>
                      </div>

                      {/* Progress Bar for Current/Completed Programs */}
                      {(isCurrent || isCompleted) && progressPercent > 0 && (
                        <div className="space-y-2 bg-black bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex justify-between text-xs font-medium">
                            {isCompleted ? (
                              <span className="flex items-center gap-1">
                                Program Completed! <span className="text-yellow-300">✨</span>
                              </span>
                            ) : (
                              <span>Week {userProgress?.current_week} of {program.duration_weeks}</span>
                            )}
                            <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full">{progressPercent}%</span>
                          </div>
                          <div className="bg-white bg-opacity-20 rounded-full h-2.5 shadow-inner">
                            <div
                              className={`${isCompleted
                                ? 'bg-gradient-to-r from-green-300 to-green-100'
                                : 'bg-gradient-to-r from-white to-blue-100'
                              } rounded-full h-2.5 transition-all duration-300 shadow-sm`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6 bg-white min-h-[300px] sm:min-h-[320px] flex flex-col">
                  {/* Program Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty_level)}`}>
                      {getDifficultyIcon(program.difficulty_level)}
                      {program.difficulty_level}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {program.duration_weeks}w
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        3x/week
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                          <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 mt-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    {isCurrent ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onProgramSelect(program.id);
                        }}
                        className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        Continue Training
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : isCompleted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onProgramSelect(program.id);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg font-medium text-sm hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Trophy className="w-4 h-4" />
                        Restart Program
                      </button>
                    ) : program.is_premium && !isAuthenticated ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAuthRequired) {
                            onAuthRequired(program.id);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 sm:py-4 rounded-lg font-medium text-sm hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Crown className="w-4 h-4" />
                        Unlock Premium Program
                      </button>
                    ) : program.is_premium && isAuthenticated ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onProgramSelect(program.id);
                        }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 sm:py-4 rounded-lg font-medium text-sm hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Crown className="w-4 h-4" />
                        Start Premium Program
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onProgramSelect(program.id);
                        }}
                        className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        Start Free Program
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Program Type Indicator */}
                <div className="absolute top-0 right-0">
                  <div className={`w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] ${program.is_premium ? 'border-t-yellow-400' : 'border-t-green-400'}`}></div>
                  <div className="absolute top-1 right-1">
                    {program.is_premium ? (
                      <Crown className="w-4 h-4 text-white" />
                    ) : (
                      <Star className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Need Help Choosing?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Foundation Builder:</strong> Perfect for beginners or anyone returning to fitness. Focus on form and fundamentals.</p>
              <p><strong>Power Surge Pro:</strong> For experienced lifters ready to take their strength to the next level with advanced techniques.</p>
              <p><strong>Beast Mode Elite:</strong> Elite-level programming for serious athletes pursuing maximum performance gains.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramSelection;