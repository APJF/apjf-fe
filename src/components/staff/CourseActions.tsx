import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { 
  Plus,
  FileDown,
  RefreshCw
} from "lucide-react"

interface CourseActionsProps {
  onRefresh?: () => void
  onCreateCourse?: () => void
  onExportCourses?: () => void
  isLoading?: boolean
  totalCourses?: number
}

export const CourseActions: React.FC<CourseActionsProps> = ({
  onRefresh,
  onCreateCourse,
  onExportCourses,
  isLoading = false,
  totalCourses = 0
}) => {
  const navigate = useNavigate()

  const handleCreateCourse = () => {
    if (onCreateCourse) {
      onCreateCourse()
    } else {
      navigate('/staff/create-course')
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleExport = () => {
    if (onExportCourses) {
      onExportCourses()
    } else {
      // Implement export functionality
      console.log('Export courses functionality to be implemented')
    }
  }

  return (
    <div className="px-6 py-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleCreateCourse}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo khóa học mới
            </Button>

            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            {totalCourses > 0 && (
              <Button 
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Xuất danh sách
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseActions
