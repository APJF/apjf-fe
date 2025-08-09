import { useState } from "react"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Languages, Eye, EyeOff } from "lucide-react"

interface ScriptViewerProps {
  materialId: string
}

interface ScriptItem {
  id: number
  japanese: string
  vietnamese: string
  timeStart: number
  timeEnd: number
}

const mockScript: ScriptItem[] = [
  {
    id: 1,
    japanese: "はじめまして。私の名前は田中です。",
    vietnamese: "Xin chào lần đầu gặp mặt. Tôi tên là Tanaka.",
    timeStart: 0,
    timeEnd: 3,
  },
  {
    id: 2,
    japanese: "どうぞよろしくお願いします。",
    vietnamese: "Rất hân hạnh được làm quen.",
    timeStart: 4,
    timeEnd: 7,
  },
  {
    id: 3,
    japanese: "私は学生です。大学で日本語を勉強しています。",
    vietnamese: "Tôi là sinh viên. Tôi đang học tiếng Nhật ở đại học.",
    timeStart: 8,
    timeEnd: 12,
  },
  {
    id: 4,
    japanese: "趣味は読書と映画鑑賞です。",
    vietnamese: "Sở thích của tôi là đọc sách và xem phim.",
    timeStart: 13,
    timeEnd: 16,
  },
]

export default function ScriptViewer({ materialId }: ScriptViewerProps) {
  // materialId can be used to fetch different scripts
  console.log('Material ID:', materialId) // Temporary to use the parameter
  const [hasFinishedAudio] = useState(true) // Mock: assume audio finished
  const [showVietnamese, setShowVietnamese] = useState<number[]>([])
  const [showAllVietnamese, setShowAllVietnamese] = useState(false)

  const toggleVietnamese = (sentenceId: number) => {
    setShowVietnamese((prev) =>
      prev.includes(sentenceId) ? prev.filter((id) => id !== sentenceId) : [...prev, sentenceId],
    )
  }

  const toggleAllVietnamese = () => {
    if (showAllVietnamese) {
      setShowVietnamese([])
    } else {
      setShowVietnamese(mockScript.map((s) => s.id))
    }
    setShowAllVietnamese(!showAllVietnamese)
  }

  if (!hasFinishedAudio) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">
          <Languages className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-sm">Vui lòng nghe hết bài để xem script</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Script Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 text-gray-800">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded mr-1"></div>
          <Languages className="w-5 h-5 text-gray-600" />
          <span className="text-base font-semibold">Script bài nghe</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllVietnamese}
          className="flex items-center space-x-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-9 px-4 transition-all duration-200"
        >
          {showAllVietnamese ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showAllVietnamese ? "Ẩn dịch" : "Hiện dịch"}</span>
        </Button>
      </div>

      {/* Script Content */}
      <div className="space-y-3">
        {mockScript.map((sentence) => (
          <div
            key={sentence.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50 px-2 py-1">
                {sentence.timeStart}s - {sentence.timeEnd}s
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleVietnamese(sentence.id)}
                className="h-7 px-3 text-xs text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                {showVietnamese.includes(sentence.id) ? "Ẩn" : "Dịch"}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-base font-medium text-gray-900 leading-relaxed">{sentence.japanese}</p>

              {showVietnamese.includes(sentence.id) && (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                  {sentence.vietnamese}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Mẹo học tập:</strong> Hãy thử nghe lại và đọc theo script để cải thiện phát âm của bạn!
        </p>
      </div>
    </div>
  )
}
