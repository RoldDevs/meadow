import AsyncStorage from '@react-native-async-storage/async-storage';

const TIME_TRACKING_KEY = '@meadow_time_tracking';
const DAILY_STATS_KEY = '@meadow_daily_stats';

/**
 * Time tracking service to help users minimize time in app
 * Tracks app usage and provides statistics
 */

/**
 * Start tracking app usage session
 */
export const startTimeTracking = async () => {
  try {
    const sessionStart = Date.now();
    await AsyncStorage.setItem(`${TIME_TRACKING_KEY}_session_start`, sessionStart.toString());
    return sessionStart;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    return null;
  }
};

/**
 * End tracking session and record the time spent
 */
export const endTimeTracking = async () => {
  try {
    const sessionStartStr = await AsyncStorage.getItem(`${TIME_TRACKING_KEY}_session_start`);
    if (!sessionStartStr) return null;

    const sessionStart = parseInt(sessionStartStr);
    const sessionEnd = Date.now();
    const sessionDuration = Math.floor((sessionEnd - sessionStart) / 1000); // in seconds

    // Get today's date as key
    const today = new Date().toISOString().split('T')[0];

    // Get existing stats for today
    const statsStr = await AsyncStorage.getItem(`${DAILY_STATS_KEY}_${today}`);
    const stats = statsStr ? JSON.parse(statsStr) : { date: today, totalSeconds: 0, sessions: [] };

    // Update stats
    stats.totalSeconds += sessionDuration;
    stats.sessions.push({
      start: sessionStart,
      end: sessionEnd,
      duration: sessionDuration,
    });

    // Save updated stats
    await AsyncStorage.setItem(`${DAILY_STATS_KEY}_${today}`, JSON.stringify(stats));

    // Clear session start
    await AsyncStorage.removeItem(`${TIME_TRACKING_KEY}_session_start`);

    return sessionDuration;
  } catch (error) {
    console.error('Error ending time tracking:', error);
    return null;
  }
};

/**
 * Get today's usage statistics
 */
export const getTodayStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsStr = await AsyncStorage.getItem(`${DAILY_STATS_KEY}_${today}`);
    
    if (!statsStr) {
      return { date: today, totalSeconds: 0, sessions: [], formattedTime: '0m' };
    }

    const stats = JSON.parse(statsStr);
    const hours = Math.floor(stats.totalSeconds / 3600);
    const minutes = Math.floor((stats.totalSeconds % 3600) / 60);
    
    stats.formattedTime = hours > 0 
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

    return stats;
  } catch (error) {
    console.error('Error getting today stats:', error);
    return { date: new Date().toISOString().split('T')[0], totalSeconds: 0, sessions: [], formattedTime: '0m' };
  }
};

/**
 * Get usage statistics for the last N days
 */
export const getWeeklyStats = async (days = 7) => {
  try {
    const stats = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayStatsStr = await AsyncStorage.getItem(`${DAILY_STATS_KEY}_${dateKey}`);
      const dayStats = dayStatsStr ? JSON.parse(dayStatsStr) : { date: dateKey, totalSeconds: 0, sessions: [] };

      const hours = Math.floor(dayStats.totalSeconds / 3600);
      const minutes = Math.floor((dayStats.totalSeconds % 3600) / 60);

      stats.push({
        ...dayStats,
        formattedTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return stats.reverse(); // Oldest to newest
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    return [];
  }
};

/**
 * Get average daily usage for the week
 */
export const getWeeklyAverage = async () => {
  try {
    const weeklyStats = await getWeeklyStats(7);
    const totalSeconds = weeklyStats.reduce((sum, day) => sum + day.totalSeconds, 0);
    const averageSeconds = Math.floor(totalSeconds / weeklyStats.length);

    const hours = Math.floor(averageSeconds / 3600);
    const minutes = Math.floor((averageSeconds % 3600) / 60);

    return {
      averageSeconds,
      formattedTime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  } catch (error) {
    console.error('Error getting weekly average:', error);
    return { averageSeconds: 0, formattedTime: '0m' };
  }
};

/**
 * Set daily usage goal in minutes
 */
export const setDailyGoal = async (goalMinutes) => {
  try {
    await AsyncStorage.setItem(`${TIME_TRACKING_KEY}_daily_goal`, goalMinutes.toString());
    return true;
  } catch (error) {
    console.error('Error setting daily goal:', error);
    return false;
  }
};

/**
 * Get daily usage goal
 */
export const getDailyGoal = async () => {
  try {
    const goalStr = await AsyncStorage.getItem(`${TIME_TRACKING_KEY}_daily_goal`);
    return goalStr ? parseInt(goalStr) : 30; // Default: 30 minutes
  } catch (error) {
    console.error('Error getting daily goal:', error);
    return 30;
  }
};

/**
 * Check if today's usage exceeded the goal
 */
export const hasExceededGoal = async () => {
  try {
    const todayStats = await getTodayStats();
    const goal = await getDailyGoal();
    const goalSeconds = goal * 60;

    return {
      exceeded: todayStats.totalSeconds > goalSeconds,
      usageSeconds: todayStats.totalSeconds,
      goalSeconds,
      percentage: Math.min(Math.floor((todayStats.totalSeconds / goalSeconds) * 100), 100),
    };
  } catch (error) {
    console.error('Error checking if exceeded goal:', error);
    return { exceeded: false, usageSeconds: 0, goalSeconds: 1800, percentage: 0 };
  }
};

/**
 * Clean up old stats (keep last 30 days)
 */
export const cleanupOldStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const statsKeys = keys.filter(key => key.startsWith(`${DAILY_STATS_KEY}_`));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const keysToDelete = statsKeys.filter(key => {
      const dateStr = key.replace(`${DAILY_STATS_KEY}_`, '');
      const keyDate = new Date(dateStr);
      return keyDate < cutoffDate;
    });

    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
      console.log(`Cleaned up ${keysToDelete.length} old stats entries`);
    }
  } catch (error) {
    console.error('Error cleaning up old stats:', error);
  }
};

