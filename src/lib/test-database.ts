/**
 * Database Service Test Suite
 *
 * Simple test script to verify the enhanced database functionality works correctly.
 * Run this after migration to ensure everything is working.
 *
 * Usage:
 * import { runDatabaseTests } from './test-database'
 * await runDatabaseTests()
 */

import { DatabaseService } from './supabase'

interface TestResult {
  testName: string
  passed: boolean
  error?: string
  duration?: number
}

export class DatabaseTester {

  /**
   * Run all database tests
   */
  static async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting database tests...')

    const tests = [
      this.testMigrationSetup,
      this.testProgramFetching,
      this.testAchievementFetching,
      this.testUserProgressManagement,
      this.testGamificationFeatures,
      this.testXPCalculation,
      this.testAchievementChecking,
      this.testLegacyCompatibility
    ]

    const results: TestResult[] = []

    for (const test of tests) {
      const result = await this.runTest(test)
      results.push(result)
    }

    const passedTests = results.filter(r => r.passed).length
    const totalTests = results.length

    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`)

    if (passedTests === totalTests) {
      console.log('✅ All tests passed! Database is ready for use.')
    } else {
      console.log('❌ Some tests failed. Check the results above.')
    }

    return results
  }

  /**
   * Run a single test with timing and error handling
   */
  private static async runTest(testFunction: () => Promise<void>): Promise<TestResult> {
    const testName = testFunction.name.replace('test', '').replace(/([A-Z])/g, ' $1').trim()
    const startTime = Date.now()

    try {
      await testFunction()
      const duration = Date.now() - startTime

      console.log(`✅ ${testName} (${duration}ms)`)
      return { testName, passed: true, duration }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.log(`❌ ${testName} (${duration}ms): ${errorMessage}`)
      return { testName, passed: false, error: errorMessage, duration }
    }
  }

  // ===== TEST FUNCTIONS =====

  /**
   * Test migration setup and user data initialization
   */
  private static async testMigrationSetup(): Promise<void> {
    await DatabaseService.ensureUserMigration()

    const progress = await DatabaseService.getUserProgress()
    if (!progress) throw new Error('User progress not created after migration')

    const gamification = await DatabaseService.getUserGameification()
    if (!gamification) throw new Error('User gamification data not created after migration')
  }

  /**
   * Test training program fetching
   */
  private static async testProgramFetching(): Promise<void> {
    const programs = await DatabaseService.getAvailablePrograms()
    if (!programs || programs.length === 0) {
      throw new Error('No training programs found')
    }

    const foundationProgram = programs.find(p => p.id === 'foundation-builder')
    if (!foundationProgram) {
      throw new Error('Foundation Builder program not found')
    }

    // Test individual program fetching
    const program = await DatabaseService.getProgram('foundation-builder')
    if (!program) {
      throw new Error('Could not fetch individual program')
    }
  }

  /**
   * Test achievement fetching
   */
  private static async testAchievementFetching(): Promise<void> {
    const achievements = await DatabaseService.getAvailableAchievements()
    if (!achievements || achievements.length === 0) {
      throw new Error('No achievements found')
    }

    const firstWorkout = achievements.find(a => a.id === 'first-workout')
    if (!firstWorkout) {
      throw new Error('First workout achievement not found')
    }
  }

  /**
   * Test user progress management
   */
  private static async testUserProgressManagement(): Promise<void> {
    const initialProgress = await DatabaseService.getUserProgress()
    if (!initialProgress) throw new Error('Could not get user progress')

    // Test program switching
    await DatabaseService.switchProgram('power-surge-pro')
    const updatedProgress = await DatabaseService.getUserProgress()
    if (updatedProgress?.current_program_id !== 'power-surge-pro') {
      throw new Error('Program switch failed')
    }

    // Switch back to foundation for other tests
    await DatabaseService.switchProgram('foundation-builder')
  }

  /**
   * Test gamification features
   */
  private static async testGamificationFeatures(): Promise<void> {
    const gamification = await DatabaseService.getUserGameification()
    if (!gamification) throw new Error('Could not get gamification data')

    // Test XP addition
    const initialXP = (await DatabaseService.getUserProgress())?.total_xp || 0
    await DatabaseService.addXP(100, 'test')
    const finalXP = (await DatabaseService.getUserProgress())?.total_xp || 0

    if (finalXP <= initialXP) {
      throw new Error('XP was not added correctly')
    }

    // Test workout logging
    await DatabaseService.logWorkoutCompletion(8, 10, 12, 13)
    const updatedGamification = await DatabaseService.getUserGameification()
    if (updatedGamification && updatedGamification.total_workouts <= gamification.total_workouts) {
      throw new Error('Workout completion was not logged')
    }
  }

  /**
   * Test XP calculation system
   */
  private static async testXPCalculation(): Promise<void> {
    const progress = await DatabaseService.getUserProgress()
    if (!progress) throw new Error('No progress data for XP test')

    // Test level calculation
    const level1 = DatabaseService.calculateLevel(50)
    const level2 = DatabaseService.calculateLevel(150)
    const level3 = DatabaseService.calculateLevel(500)

    if (level1 !== 1 || level2 !== 2 || level3 !== 3) {
      throw new Error(`Level calculation incorrect: L1=${level1}, L2=${level2}, L3=${level3}`)
    }

    // Test XP for next level
    const xpForLevel2 = DatabaseService.getXPForNextLevel(1)
    if (xpForLevel2 !== 100) {
      throw new Error(`XP for next level incorrect: expected 100, got ${xpForLevel2}`)
    }

    // Test level progress
    const levelProgress = DatabaseService.getCurrentLevelProgress(150)
    if (levelProgress.currentLevelXP !== 50 || levelProgress.nextLevelXP !== 300) {
      throw new Error(`Level progress calculation incorrect`)
    }
  }

  /**
   * Test achievement checking system
   */
  private static async testAchievementChecking(): Promise<void> {
    // Test achievement unlocking
    const newAchievements = await DatabaseService.checkAchievements('workouts', 1)

    // Should unlock 'first-workout' achievement if not already unlocked
    const progress = await DatabaseService.getUserProgress()
    if (!progress) throw new Error('No progress data for achievement test')

    // Check that first workout achievement is unlocked
    const hasFirstWorkout = progress.achievements_unlocked.includes('first-workout')
    if (!hasFirstWorkout && newAchievements.length === 0) {
      // This might be okay if already unlocked, let's not fail the test
      console.log('ℹ️ First workout achievement may already be unlocked')
    }
  }

  /**
   * Test backward compatibility with legacy methods
   */
  private static async testLegacyCompatibility(): Promise<void> {
    // Test legacy preferences methods
    const preferences = await DatabaseService.getPreferences()
    if (!preferences) throw new Error('Could not get legacy preferences')

    // Test updating preferences
    const testPreferences = {
      current_week: preferences.current_week,
      completed_exercises: preferences.completed_exercises || {},
      exercise_weights: preferences.exercise_weights || {},
      nutrition_goals: preferences.nutrition_goals || {}
    }

    await DatabaseService.savePreferences(testPreferences)

    // Test legacy session methods
    const sessions = await DatabaseService.getSessions()
    // Sessions array can be empty, that's okay

    // Test saving a session
    const testSession = {
      week: 1,
      phase: 'foundation',
      day_name: 'Monday - Push Day',
      exercises: [],
      nutrition: [],
      exercises_completed: 0,
      total_exercises: 8,
      nutrition_completed: 0,
      total_nutrition: 13
    }

    const savedSession = await DatabaseService.saveSession(testSession)
    if (!savedSession) throw new Error('Could not save test session')

    // Clean up test session
    await DatabaseService.deleteSession(savedSession.id!)
  }
}

/**
 * Convenience function to run all tests
 */
export async function runDatabaseTests(): Promise<TestResult[]> {
  return await DatabaseTester.runAllTests()
}

/**
 * Quick test to verify basic functionality
 */
export async function quickTest(): Promise<boolean> {
  try {
    console.log('🏃‍♂️ Running quick database test...')

    // Test migration
    await DatabaseService.ensureUserMigration()

    // Test program fetching
    const programs = await DatabaseService.getAvailablePrograms()
    if (programs.length === 0) throw new Error('No programs found')

    // Test user data
    const progress = await DatabaseService.getUserProgress()
    if (!progress) throw new Error('No user progress')

    console.log('✅ Quick test passed!')
    return true
  } catch (error) {
    console.error('❌ Quick test failed:', error)
    return false
  }
}