import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { StaffNavigation } from "../components/layout/StaffNavigation"
import { CourseStats } from "../components/staff/CourseStats"
import { CourseListTable } from "../components/staff/CourseListTable"
import { Alert } from "../components/ui/Alert"
import { CheckCircle } from "lucide-react"

export const StaffCoursesPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check for success message from navigation state
    const state = location.state as { message?: string; refreshData?: boolean; timestamp?: number } | null
    if (state?.message) {
      setSuccessMessage(state.message)
      // Auto hide message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
      
      // Force refresh data if needed
      if (state.refreshData || state.timestamp) {
        setRefreshTrigger(prev => prev + 1)
      }
      
      // Clear the state to prevent showing message on back navigation
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  const handleCreateCourse = () => {
    navigate('/staff/create-course')
  }

  return (
    <StaffNavigation>
      <div className="space-y-8 px-6 py-4">
        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <div className="ml-2">{successMessage}</div>
          </Alert>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa học</h1>
          <p className="text-gray-600 mt-2">Quản lý và theo dõi tất cả khóa học trong hệ thống</p>
        </div>

        {/* Course Statistics */}
        <CourseStats refreshTrigger={refreshTrigger} />

        {/* Course List Table */}
        <CourseListTable 
          onCreateCourse={handleCreateCourse} 
          refreshTrigger={refreshTrigger}
        />
      </div>
    </StaffNavigation>
  )
}

export default StaffCoursesPage
