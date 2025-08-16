import { useState } from "react"
import { Button } from "../ui/Button"
import { ZoomIn, ZoomOut, Download, FileText } from "lucide-react"

interface PDFViewerProps {
  materialId: string
  fileUrl: string
}

export function PDFViewer({ materialId, fileUrl }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)

  const zoomIn = () => setZoom((prev) => Math.min(200, prev + 25))
  const zoomOut = () => setZoom((prev) => Math.max(50, prev - 25))

  const handleDownload = () => {
    // Open the PDF in a new tab for viewing/downloading
    window.open(fileUrl, '_blank')
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
            onClick={handleDownload}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent h-8 w-8 p-0 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="bg-gray-50 min-h-[900px] overflow-auto rounded-lg border border-gray-200">
        <iframe
          src={fileUrl}
          className="w-full h-[900px] border-0 rounded-lg"
          title={`PDF Material ${materialId}`}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        />
      </div>
    </div>
  )
}