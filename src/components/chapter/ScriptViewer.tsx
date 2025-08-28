import { useState } from "react"
import { Button } from "../ui/Button"
import { Languages, Eye, EyeOff } from "lucide-react"

interface ScriptViewerProps {
  script: string
  translation: string
}

interface ScriptItem {
  id: number
  japanese: string
  vietnamese: string
  timeStart: number
  timeEnd: number
}

// Function to parse script and translation into structured data
const parseScriptData = (script: string, translation: string): ScriptItem[] => {
  // If script or translation is empty, return empty array
  if (!script || !translation) return []

  // Split by lines and filter empty lines
  const scriptLines = script.split('\n').filter(line => line.trim())
  const translationLines = translation.split('\n').filter(line => line.trim())

  // Create script items (assuming each line is a sentence)
  const items: ScriptItem[] = []
  const maxLines = Math.max(scriptLines.length, translationLines.length)

  for (let i = 0; i < maxLines; i++) {
    items.push({
      id: i + 1,
      japanese: scriptLines[i] || '',
      vietnamese: translationLines[i] || '',
      timeStart: i * 5, // Estimate 5 seconds per sentence
      timeEnd: (i + 1) * 5 - 1,
    })
  }

  return items
}

export function ScriptViewer({ script, translation }: ScriptViewerProps) {
  // Parse script data from props
  const scriptData = parseScriptData(script, translation)
  
  const [hasFinishedAudio] = useState(true) // Mock: assume audio finished
  const [showVietnamese, setShowVietnamese] = useState<number[]>([])
  const [showScript, setShowScript] = useState(false) // New state for showing/hiding script

  const toggleVietnamese = (sentenceId: number) => {
    setShowVietnamese((prev) =>
      prev.includes(sentenceId) ? prev.filter((id) => id !== sentenceId) : [...prev, sentenceId],
    )
  }

  const toggleAllVietnamese = () => {
    if (showVietnamese.length === scriptData.length) {
      setShowVietnamese([])
    } else {
      setShowVietnamese(scriptData.map((s) => s.id))
    }
  }

  const toggleScript = () => {
    setShowScript(!showScript)
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
        <div className="flex items-center space-x-2">
          {showScript && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllVietnamese}
              className="flex items-center space-x-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-9 px-4 transition-all duration-200"
            >
              {showVietnamese.length === scriptData.length ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showVietnamese.length === scriptData.length ? "Ẩn dịch" : "Hiện dịch"}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleScript}
            className="flex items-center space-x-2 text-sm border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-9 px-4 transition-all duration-200"
          >
            {showScript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showScript ? "Ẩn script" : "Hiện script"}</span>
          </Button>
        </div>
      </div>

      {/* Script Content */}
      {showScript && (
        <div className="space-y-3">
          {scriptData.length > 0 ? (
            scriptData.map((sentence) => (
              <div
                key={sentence.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  {/* <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50 px-2 py-1">
                    {sentence.timeStart}s - {sentence.timeEnd}s
                  </Badge> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVietnamese(sentence.id)}
                    className="h-7 px-3 text-xs text-gray-600 hover:bg-blue-100 hover:text-blue-600 border border-gray-400 rounded transition-all duration-200 shadow-sm"
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Không có script nào để hiển thị</p>
            </div>
          )}
        </div>
      )}

      {showScript && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Mẹo học tập:</strong> Hãy thử nghe lại và đọc theo script để cải thiện phát âm của bạn!
          </p>
        </div>
      )}
    </div>
  )
}
