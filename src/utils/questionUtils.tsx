import { FileText, CheckCircle, Lightbulb } from "lucide-react";

export const getQuestionIcon = (type: string) => {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return <FileText className="h-4 w-4" />
    case "TRUE_FALSE":
      return <CheckCircle className="h-4 w-4" />
    case "WRITING":
      return <Lightbulb className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "Trắc nghiệm"
    case "TRUE_FALSE":
      return "Đúng/Sai"
    case "WRITING":
      return "Tự luận"
    default:
      return "Câu hỏi"
  }
}
