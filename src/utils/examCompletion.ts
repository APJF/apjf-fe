/**
 * Utility functions for handling exam completion events
 * across different browser tabs/windows
 * 
 * Usage in Exam Result Page:
 * 
 * import { notifyExamCompletion } from '../../utils/examCompletion'
 * 
 * // After exam completion
 * const handleExamCompletion = (examData) => {
 *   const completionData = {
 *     examId: examData.examId,
 *     unitId: examData.unitId, // Important: must have unitId
 *     passed: examData.score >= passingScore,
 *     score: examData.score,
 *     completedAt: new Date().toISOString()
 *   }
 *   
 *   notifyExamCompletion(completionData)
 * }
 */

export interface ExamCompletionData {
  examId: string
  unitId: string
  passed: boolean
  score?: number
  completedAt: string
}

/**
 * Notify other tabs that an exam has been completed
 * This will trigger unit status refresh in other open tabs
 */
export const notifyExamCompletion = (data: ExamCompletionData) => {
  try {
    localStorage.setItem('examCompleted', JSON.stringify(data))
    
    // Also dispatch a custom event for same-tab updates
    const event = new CustomEvent('examCompleted', { detail: data })
    window.dispatchEvent(event)
    
    // Remove the storage item after a short delay to prevent duplicate processing
    setTimeout(() => {
      localStorage.removeItem('examCompleted')
    }, 1000)
  } catch (error) {
    console.error('Error notifying exam completion:', error)
  }
}

/**
 * Listen for exam completion events in the current tab
 */
export const listenForExamCompletion = (
  callback: (data: ExamCompletionData) => void
) => {
  const handleCustomEvent = (event: CustomEvent<ExamCompletionData>) => {
    callback(event.detail)
  }

  window.addEventListener('examCompleted', handleCustomEvent as EventListener)
  
  return () => {
    window.removeEventListener('examCompleted', handleCustomEvent as EventListener)
  }
}
