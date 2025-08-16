import { useState, useEffect, useRef } from "react"
import { Button } from "../ui/Button"
import { ZoomIn, ZoomOut, Download, FileText, Maximize2, Minimize2, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import * as pdfjs from 'pdfjs-dist'

// Set worker source to use local worker from public folder
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface PDFViewerProps {
  materialId: string
  fileUrl: string
}

export function PDFViewer({ fileUrl }: Readonly<PDFViewerProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{pageNum: number, text: string}>>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [fitMode, setFitMode] = useState<'page' | 'width' | 'none'>('none')
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightMatches, setHighlightMatches] = useState<Array<{pageNum: number, items: Array<{left: number, top: number, width: number, height: number}>}>>([])
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [pageInput, setPageInput] = useState('')

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const loadingTask = pdfjs.getDocument(fileUrl)
        const pdf = await loadingTask.promise
        
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setPageNum(1)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('Không thể tải file PDF')
      } finally {
        setLoading(false)
      }
    }

    if (fileUrl) {
      loadPDF()
    }
  }, [fileUrl])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      // Handle window resize if needed
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Render page when PDF doc, page num, or zoom changes
  useEffect(() => {
    const renderPage = async (num: number, scale: number) => {
      if (!pdfDoc || !canvasRef.current) return

      try {
        const page = await pdfDoc.getPage(num)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        
        if (!context) return

        // Use higher DPI for better quality
        const devicePixelRatio = window.devicePixelRatio || 1
        const outputScale = devicePixelRatio * scale
        
        const viewport = page.getViewport({ scale: outputScale })
        
        // Set actual size in memory (for sharp rendering)
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        // Scale it back down using CSS for display
        canvas.style.width = Math.floor(viewport.width / devicePixelRatio) + 'px'
        canvas.style.height = Math.floor(viewport.height / devicePixelRatio) + 'px'
        
        // Scale the drawing context so everything will work at the higher DPI
        context.scale(devicePixelRatio, devicePixelRatio)

        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale }),
          canvas: canvas
        }

        await page.render(renderContext).promise
        
        // Clear existing text layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = ''
        }

        // Create text layer for search highlighting
        if (searchTerm && textLayerRef.current) {
          const textContent = await page.getTextContent()
          const textLayer = textLayerRef.current
          const pageViewport = page.getViewport({ scale })
          
          // Clear existing highlights
          textLayer.innerHTML = ''
          
          // Set text layer to match canvas exactly
          textLayer.style.left = '0px'
          textLayer.style.top = '0px'
          textLayer.style.width = canvas.style.width
          textLayer.style.height = canvas.style.height
          
          // Find current page highlights
          const currentPageHighlights = highlightMatches.find(h => h.pageNum === num)
          
          if (currentPageHighlights) {
            const searchTermLower = searchTerm.toLowerCase()
            
            textContent.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              if (item.str?.toLowerCase().includes(searchTermLower)) {
                const text = item.str
                const textLower = text.toLowerCase()
                let startIndex = 0
                
                // Get the transformation matrix
                const transform = item.transform
                const x = transform[4]
                const y = transform[5]
                
                // Find all occurrences of search term in this text item
                while (startIndex < text.length) {
                  const foundIndex = textLower.indexOf(searchTermLower, startIndex)
                  if (foundIndex === -1) break
                  
                  // Calculate position for this specific match
                  const beforeText = text.substring(0, foundIndex)
                  const matchText = text.substring(foundIndex, foundIndex + searchTerm.length)
                  
                  // More accurate character width calculation
                  const fontSize = Math.abs(transform[3]) || item.height || 12
                  const charWidth = fontSize * 0.6 // Approximation based on font size
                  const offsetX = beforeText.length * charWidth
                  
                  const highlightDiv = document.createElement('div')
                  highlightDiv.style.position = 'absolute'
                  
                  // Calculate positions with proper scaling
                  const scaledX = x * scale
                  const scaledY = (pageViewport.height - y - fontSize) * scale 
                  const scaledOffsetX = offsetX * scale
                  const scaledWidth = matchText.length * charWidth * scale
                  const scaledHeight = fontSize * scale
                  
                  highlightDiv.style.left = (scaledX + scaledOffsetX) + 'px'
                  highlightDiv.style.top = scaledY + 'px'
                  highlightDiv.style.width = scaledWidth + 'px'
                  highlightDiv.style.height = scaledHeight + 'px'
                  highlightDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.4)'
                  highlightDiv.style.border = '1px solid rgba(255, 193, 7, 0.8)'
                  highlightDiv.style.borderRadius = '2px'
                  highlightDiv.style.pointerEvents = 'none'
                  highlightDiv.style.zIndex = '2'
                  highlightDiv.style.boxSizing = 'border-box'
                  
                  textLayer.appendChild(highlightDiv)
                  
                  startIndex = foundIndex + searchTerm.length
                }
              }
            })
          }
        }
      } catch (err) {
        console.error('Error rendering page:', err)
        setError('Không thể hiển thị trang PDF')
      }
    }

    if (pdfDoc) {
      const scale = zoom / 100
      renderPage(pageNum, scale)
    }
  }, [pdfDoc, pageNum, zoom, searchTerm, highlightMatches])

  // Control functions
  const zoomIn = () => {
    setZoom(prev => prev + 25) // Remove max limit
    setFitMode('none')
  }
  const zoomOut = () => {
    setZoom(prev => Math.max(10, prev - 25))
    setFitMode('none')
  }
  const handleZoomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10)
    if (isNaN(value)) value = 100
    value = Math.max(10, value) // Remove max limit
    setZoom(value)
    setFitMode('none')
  }

  const fitToPage = async () => {
    if (!pdfDoc || !containerRef.current) return
    
    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      
      // Calculate scale to fit page in container (with some padding)
      const containerWidth = containerRef.current.clientWidth - 40 // 40px padding
      const containerHeight = 900 - 120 // Container height minus toolbar/padding
      
      const scaleX = containerWidth / viewport.width
      const scaleY = containerHeight / viewport.height
      const optimalScale = Math.min(scaleX, scaleY)
      
      const newZoom = Math.round(optimalScale * 100)
      setZoom(Math.max(10, newZoom)) // Remove max limit for zoom
      setFitMode('page')
    } catch (err) {
      console.error('Error fitting to page:', err)
    }
  }

  const fitToWidth = async () => {
    if (!pdfDoc || !containerRef.current) return
    
    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      
      const containerWidth = containerRef.current.clientWidth - 40
      const scaleX = containerWidth / viewport.width
      const newZoom = Math.round(scaleX * 100)
      setZoom(Math.max(10, newZoom)) // Remove max limit for zoom
      setFitMode('width')
    } catch (err) {
      console.error('Error fitting to width:', err)
    }
  }

  const toggleFitMode = async () => {
    if (fitMode === 'none' || fitMode === 'width') {
      await fitToPage()
      setIsExpanded(true)
    } else {
      await fitToWidth()
      setIsExpanded(false)
    }
  }

  const handleDownload = () => {
    window.open(fileUrl, '_blank')
  }

  // Search functionality
  const searchInPDF = async () => {
    if (!pdfDoc || !searchTerm.trim()) return

    setSearchResults([])
    setHighlightMatches([])
    const results: Array<{pageNum: number, text: string}> = []
    const highlights: Array<{pageNum: number, items: Array<{left: number, top: number, width: number, height: number}>}> = []

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .filter((item: any) => item.str) // eslint-disable-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str) // eslint-disable-line @typescript-eslint/no-explicit-any
          .join(' ')

        if (pageText.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            pageNum,
            text: pageText.substring(0, 100) + '...'
          })
          
          // Find highlight positions
          const pageHighlights: Array<{left: number, top: number, width: number, height: number}> = []
          textContent.items.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (item.str?.toLowerCase().includes(searchTerm.toLowerCase())) {
              pageHighlights.push({
                left: item.transform[4],
                top: item.transform[5],
                width: item.width,
                height: item.height
              })
            }
          })
          
          if (pageHighlights.length > 0) {
            highlights.push({
              pageNum,
              items: pageHighlights
            })
          }
        }
      } catch (err) {
        console.error(`Error searching page ${pageNum}:`, err)
      }
    }

    setSearchResults(results)
    setHighlightMatches(highlights)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    if (results.length > 0) {
      setPageNum(results[0].pageNum)
    }
  }

  const nextSearchResult = () => {
    if (searchResults.length === 0) return
    const nextIndex = (currentSearchIndex + 1) % searchResults.length
    setCurrentSearchIndex(nextIndex)
    setPageNum(searchResults[nextIndex].pageNum)
  }

  const prevSearchResult = () => {
    if (searchResults.length === 0) return
    const prevIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
    setCurrentSearchIndex(prevIndex)
    setPageNum(searchResults[prevIndex].pageNum)
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setSearchTerm('')
      setSearchResults([])
      setCurrentSearchIndex(-1)
      setHighlightMatches([])
    }
  }

  const goToNextPage = () => {
    if (pageNum < totalPages) {
      setPageNum(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (pageNum > 1) {
      setPageNum(prev => prev - 1)
    }
  }

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput, 10)
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setPageNum(page)
        setPageInput('')
      }
    }
  }

  const handlePageBlur = () => {
    const page = parseInt(pageInput, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setPageNum(page)
    }
    setPageInput('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {/* Header Row - Title and Page Info */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-800">Trình xem PDF</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Trang</span>
          <input
            type="text"
            value={pageInput || pageNum}
            onChange={handlePageInput}
            onKeyDown={handlePageSubmit}
            onBlur={handlePageBlur}
            onFocus={(e) => {
              setPageInput(pageNum.toString())
              e.target.select()
            }}
            className="w-12 text-center text-sm font-medium border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            title="Nhập số trang để đi đến trang đó"
          />
          <span className="text-sm text-gray-600">/ {totalPages}</span>
        </div>
      </div>

      {/* Toolbar Row - All Controls */}
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Search controls */}
          {showSearch ? (
            <div className="flex items-center bg-white rounded-lg border-2 border-blue-200 focus-within:border-blue-400 shadow-sm px-3 py-1.5 transition-all duration-200">
              <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchInPDF()}
                placeholder="Nhập từ khóa tìm kiếm..."
                className="w-40 text-sm focus:outline-none bg-transparent text-gray-700 placeholder-gray-400"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={searchInPDF}
                  className="ml-2 text-blue-600 hover:text-blue-800 transition-colors duration-150 flex-shrink-0"
                  title="Tìm kiếm"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSearch}
                className="ml-2 border-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 bg-transparent h-6 w-6 p-0 transition-all duration-200"
                title="Đóng tìm kiếm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSearch}
              className="border-gray-300 text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-300 bg-transparent h-8 w-8 p-0 transition-all duration-200 shadow-sm"
              title="Tìm kiếm trong PDF"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          
          {/* Search results info - Fixed position */}
          {showSearch && searchResults.length > 0 && (
            <div className="flex items-center bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-xs text-yellow-800">
              <span className="font-medium mr-2">
                {currentSearchIndex >= 0 ? currentSearchIndex + 1 : 0}/{searchResults.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={prevSearchResult}
                disabled={searchResults.length === 0}
                className="border-0 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 bg-transparent h-5 w-5 p-0 transition-all duration-200 disabled:opacity-30 mr-1"
                title="Kết quả trước"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSearchResult}
                disabled={searchResults.length === 0}
                className="border-0 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 bg-transparent h-5 w-5 p-0 transition-all duration-200 disabled:opacity-30"
                title="Kết quả sau"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Page navigation - Left side of center */}
          <div className="flex items-center space-x-1 bg-white rounded border border-gray-300 px-2 py-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNum <= 1}
              className="border-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent h-6 w-6 p-0 transition-all duration-200 disabled:opacity-30"
              title="Trang trước"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNum >= totalPages}
              className="border-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent h-6 w-6 p-0 transition-all duration-200 disabled:opacity-30"
              title="Trang sau"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Zoom controls - Center */}
          <div className="flex items-center space-x-1 bg-white rounded border border-gray-300 px-2 py-1">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="border-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent h-6 w-6 p-0 transition-all duration-200"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <input
              type="number"
              min={10}
              value={zoom}
              onChange={handleZoomInput}
              className="w-12 text-center border-0 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 bg-transparent text-gray-700"
              aria-label="Zoom percentage"
            />
            <span className="text-xs text-gray-600">%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="border-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent h-6 w-6 p-0 transition-all duration-200"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Fit and Download controls - Right side */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFitMode}
            className="border-gray-300 text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-300 bg-transparent h-8 w-8 p-0 transition-all duration-200"
            title={isExpanded ? 'Thu gọn về chiều rộng' : 'Mở rộng vừa trang'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="border-gray-300 text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-300 bg-transparent h-8 w-8 p-0 transition-all duration-200"
            title="Tải xuống PDF"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="bg-gray-50 h-[900px] overflow-auto rounded-lg border border-gray-200 p-4 relative">
        {/* Search term highlight info */}
        {searchTerm && searchResults.length > 0 && (
          <div className="sticky top-2 left-2 right-2 z-10 flex justify-center mb-4">
            <div className="bg-yellow-100 border border-yellow-400 rounded-lg px-4 py-2 text-sm text-yellow-800 shadow-md">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Tìm thấy <strong>"{searchTerm}"</strong> - {searchResults.length} kết quả</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <div className="relative inline-block">
            <canvas 
              ref={canvasRef}
              className="border border-gray-300 shadow-lg bg-white rounded-sm"
              style={{ 
                display: 'block',
                maxWidth: 'none'
              }}
            />
            {/* Text layer for highlighting */}
            <div 
              ref={textLayerRef}
              className="absolute pointer-events-none"
              style={{ 
                left: 0, 
                top: 0,
                zIndex: 1
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}