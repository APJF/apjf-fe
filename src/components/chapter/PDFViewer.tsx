import { useState } from "react"
import { Button } from "../ui/Button"
import { ZoomIn, ZoomOut, Download, FileText } from "lucide-react"

interface PDFViewerProps {
  materialId: string
}

export default function PDFViewer({ materialId }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)

  const zoomIn = () => setZoom((prev) => Math.min(200, prev + 25))
  const zoomOut = () => setZoom((prev) => Math.max(50, prev - 25))

  // Mock PDF content based on material type
  const getMockContent = () => {
    if (materialId.includes("vocabulary")) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center mb-4 text-gray-800">挨拶の語彙</h2>
          <div className="grid gap-3">
            {[
              { japanese: "はじめまして", reading: "hajimemashite", meaning: "Xin chào lần đầu gặp mặt" },
              { japanese: "よろしく", reading: "yoroshiku", meaning: "Rất hân hạnh" },
              { japanese: "お名前", reading: "onamae", meaning: "Tên (lịch sự)" },
              { japanese: "学生", reading: "gakusei", meaning: "Sinh viên" },
              { japanese: "先生", reading: "sensei", meaning: "Giáo viên" },
            ].map((word, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">{word.japanese}</p>
                    <p className="text-sm text-gray-600 font-medium">{word.reading}</p>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{word.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    } else if (materialId.includes("kanji")) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center mb-4 text-gray-800">基本漢字</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { kanji: "人", reading: "ひと/じん", meaning: "Người" },
              { kanji: "学", reading: "がく", meaning: "Học" },
              { kanji: "生", reading: "せい", meaning: "Sinh, sống" },
              { kanji: "名", reading: "な/めい", meaning: "Tên" },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white text-center hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <p className="text-5xl font-bold text-gray-900 mb-2">{item.kanji}</p>
                <p className="text-sm text-gray-600 font-medium mb-1">{item.reading}</p>
                <p className="text-sm text-gray-800 font-medium">{item.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center mb-4 text-gray-800">自己紹介の読み物</h2>
          <div className="prose max-w-none">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
              <p className="text-base leading-relaxed text-gray-800">
                はじめまして。私の名前は田中太郎です。二十歳です。大学生です。
              </p>
              <p className="text-base leading-relaxed text-gray-800">
                趣味は読書と映画鑑賞です。好きな食べ物は寿司です。
              </p>
              <p className="text-base leading-relaxed text-gray-800">どうぞよろしくお願いします。</p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-bold mb-2 text-gray-800 text-base">Hướng dẫn đọc:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>はじめまして (hajimemashite) - Lời chào khi gặp lần đầu</p>
                <p>よろしくお願いします (yoroshiku onegaishimasu) - Rất hân hạnh được làm quen</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div>
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="text-base font-semibold text-gray-800">Trình xem PDF</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-8 w-8 p-0 transition-all duration-200"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center text-gray-800">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-8 w-8 p-0 transition-all duration-200"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-8 w-8 p-0 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="bg-gray-50 min-h-[450px] overflow-auto rounded-lg border border-gray-200">
        <div
          className="bg-white shadow-sm rounded-lg p-4 mx-auto max-w-4xl border border-gray-200 m-3"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          {getMockContent()}
        </div>
      </div>
    </div>
  )
}
