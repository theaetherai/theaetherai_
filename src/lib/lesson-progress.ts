import axios from 'axios'
import { checkIfRouteExists, withRouteCheck } from './route-checker'
import { toast } from 'sonner'

/**
 * Updates a user's progress in a lesson with safety checks to ensure the API exists
 * 
 * @param lessonId The ID of the lesson to update progress for
 * @param progress The progress value between 0-100
 * @param completed Whether the lesson is completed
 * @returns The API response data or null if the request failed
 */
export async function updateLessonProgress(
  lessonId: string, 
  progress: number, 
  completed: boolean = false
) {
  const progressRoute = `/api/courses/lessons/${lessonId}/progress`;
  
  return withRouteCheck(
    progressRoute,
    async () => {
      try {
        const response = await axios.post(progressRoute, {
          progress,
          completed
        })
        return response.data
      } catch (error) {
        console.error('Error updating lesson progress:', error)
        return null
      }
    },
    () => {
      // Fallback behavior when the API doesn't exist
      console.warn('Progress tracking API not implemented yet')
      
      // Store progress in localStorage as fallback
      try {
        const storageKey = `lesson_progress_${lessonId}`;
        localStorage.setItem(storageKey, JSON.stringify({ progress, completed }));
      } catch (e) {
        console.error('Failed to store progress in localStorage:', e)
      }
      
      return null
    }
  );
}

/**
 * Fetches a user's progress for a specific lesson with safety checks
 * 
 * @param lessonId The ID of the lesson to get progress for
 * @returns The progress data or null if the request failed
 */
export async function getLessonProgress(lessonId: string) {
  const progressRoute = `/api/courses/lessons/${lessonId}/progress`;
  
  return withRouteCheck(
    progressRoute,
    async () => {
      try {
        const response = await axios.get(progressRoute)
        return response.data
      } catch (error) {
        console.error('Error fetching lesson progress:', error)
        return null
      }
    },
    () => {
      // Fallback behavior when the API doesn't exist
      console.warn('Progress tracking API not implemented yet')
      
      // Try to read from localStorage as fallback
      try {
        const storageKey = `lesson_progress_${lessonId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return { data: JSON.parse(stored) };
        }
      } catch (e) {
        console.error('Failed to read progress from localStorage:', e)
      }
      
      return { data: { progress: 0, completed: false } }
    }
  );
} 