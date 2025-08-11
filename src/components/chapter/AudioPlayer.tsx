import { useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { Button } from "../ui/Button"
import { Slider } from "../ui/Slider"

interface AudioPlayerProps {
  materialId: string
}

export default function AudioPlayer({ materialId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [hasFinished, setHasFinished] = useState(false)

  // Mock audio duration
  useEffect(() => {
    setDuration(180) // 3 minutes
  }, [materialId])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      // Simulate audio playing
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            setHasFinished(true)
            clearInterval(interval)
            return duration
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  const skipBackward = () => {
    setCurrentTime(Math.max(0, currentTime - 10))
  }

  const skipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10))
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* Progress bar lên trên */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 w-10 text-center font-medium">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleProgressChange}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-10 text-center font-medium">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls và volume cùng hàng */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={skipBackward}
            className="border-gray-200 text-gray-600 hover:bg-gray-100 bg-transparent h-9 w-9 p-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-0 shadow-md"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={skipForward}
            className="border-gray-200 text-gray-600 hover:bg-gray-100 bg-transparent h-9 w-9 p-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <Slider value={[volume]} max={100} step={1} onValueChange={(value: number[]) => setVolume(value[0])} className="w-20" />
          <span className="text-sm text-gray-600 w-8 text-center font-medium">{volume}%</span>
        </div>
      </div>

      {hasFinished && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 text-center font-medium">
            ✅ 聞き終わりました！下のスクリプトをご覧ください。
          </p>
        </div>
      )}
    </div>
  )
}
