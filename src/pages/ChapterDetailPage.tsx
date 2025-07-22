import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, BookOpen, FileText, Languages, CheckCircle } from "lucide-react";
import { CourseDetailService } from "../services/courseDetailService";
import type { Chapter, Material, Unit } from "../types/courseDetail";

export default function ChapterDetailPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (chapterId) {
      fetchChapterDetail();
      checkEnrollmentStatus();
    } else {
      setError("ID chương không hợp lệ");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const fetchChapterDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CourseDetailService.getChapterDetail(chapterId!);

      if (response.success) {
        const chapterData = response.data;
        
        if (chapterData) {
          // Sắp xếp các unit dựa theo prerequisiteUnitId
          chapterData.units = sortUnitsByPrerequisites(chapterData.units);
          setChapter(chapterData);
        } else {
          setError("Không tìm thấy thông tin chương học");
        }
      } else {
        setError(response.message || "Không thể tải thông tin chương học");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      console.error("Error fetching chapter detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsEnrolled(true);
      setCompletedUnits(["unit-01", "unit-02"]);
    }
  };

  // Hàm sắp xếp units dựa trên trường prerequisiteUnitId
  const sortUnitsByPrerequisites = (units: Unit[]): Unit[] => {
    // Tạo một bản sao của mảng để tránh thay đổi trực tiếp tham số đầu vào
    const sortedUnits = [...units];
    
    // Sắp xếp units theo thứ tự học tập dựa trên prerequisiteUnitId
    sortedUnits.sort((a, b) => {
      // Nếu unit không có prerequisite (null), đặt nó lên đầu
      if (a.prerequisiteUnitId === null) return -1;
      if (b.prerequisiteUnitId === null) return 1;
      
      // Nếu unit B phụ thuộc vào unit A, đặt A trước B
      if (b.prerequisiteUnitId === a.id) return -1;
      if (a.prerequisiteUnitId === b.id) return 1;
      
      // Nếu không có mối quan hệ trực tiếp, giữ nguyên thứ tự
      return 0;
    });
    
    // Sắp xếp tiếp các materials trong mỗi unit nếu cần
    sortedUnits.forEach(unit => {
      if (unit.materials && unit.materials.length > 0) {
        // Sắp xếp materials theo thứ tự type: VOCAB -> GRAMMAR -> LISTENING -> SPEAKING -> READING
        unit.materials.sort((a: Material, b: Material) => {
          const typeOrder: Record<string, number> = {
            'VOCAB': 1,
            'GRAMMAR': 2,
            'LISTENING': 3,
            'SPEAKING': 4,
            'READING': 5
          };
          
          return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        });
      }
    });
    
    return sortedUnits;
  };

  // Xử lý render nội dung tài liệu
  const renderMaterialContent = () => {
    if (!selectedMaterial) return null;
    
    if (selectedMaterial.fileUrl.endsWith('.pdf')) {
      return (
        <div className="w-full h-full">
          <iframe
            src={selectedMaterial.fileUrl}
            title={selectedMaterial.description}
            className="w-full h-full"
          />
        </div>
      );
    }
    
    if (selectedMaterial.fileUrl.endsWith('.mp4') || selectedMaterial.fileUrl.endsWith('.webm')) {
      return (
        <div className="w-full max-w-3xl mx-auto">
          <video 
            controls 
            className="w-full rounded-lg shadow-lg"
            poster="/img/NhatBan.webp"
          >
            <source src={selectedMaterial.fileUrl} type={`video/${selectedMaterial.fileUrl.split('.').pop()}`} />
            <track kind="captions" src="" label="Vietnamese" />
            Trình duyệt của bạn không hỗ trợ video này.
          </video>
          <h3 className="text-xl font-semibold mt-4 mb-2">{selectedMaterial.description}</h3>
        </div>
      );
    }
    
    // Generic file display
    return (
      <div className="text-center">
        <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
          <FileText className="h-16 w-16 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedMaterial.description}</h3>
        <p className="text-gray-600 mb-6">
          Tài liệu: {selectedMaterial.fileUrl}
        </p>
        <a 
          href={selectedMaterial.fileUrl} 
          download
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tải xuống
        </a>
      </div>
    );
  };

  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}/preparation`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Đang tải thông tin chương học...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Không thể tải thông tin chương học</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchChapterDetail}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getUnitIcon = () => {
    return <BookOpen className="h-5 w-5" />;
  };
  
  const toggleUnitExpand = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="p-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại tổng quan</span>
          </button>
        </div>

        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Languages className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Khóa học tiếng Nhật</h1>
              <p className="text-xl opacity-90">Từ cơ bản đến nâng cao</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Units List */}
        <div className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Danh sách bài học</h2>
            <p className="text-sm text-gray-600">Chọn unit và kỹ năng để học</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="font-medium text-gray-900 mb-4">
                {chapter.title}
              </div>
              {chapter.units.map((unit) => {
                const isCompleted = completedUnits.includes(unit.id);
                const isExpanded = expandedUnit === unit.id;
                const hasPrerequisite = unit.prerequisiteUnitId !== null;
                const prerequisiteUnit = hasPrerequisite ? 
                  chapter.units.find(u => u.id === unit.prerequisiteUnitId) : null;
                
                // Xác định styles dựa vào trạng thái
                let buttonStyle = 'hover:bg-gray-50 border border-gray-100';
                if (isCompleted) {
                  buttonStyle = 'bg-green-50 border-l-4 border-l-green-500';
                } else if (hasPrerequisite) {
                  buttonStyle = 'hover:bg-gray-50 border border-gray-100 border-l-4 border-l-yellow-300';
                }
                
                let iconStyle = 'bg-gradient-to-br from-blue-500 to-blue-600';
                if (isCompleted) {
                  iconStyle = 'bg-gradient-to-br from-green-500 to-green-600';
                } else if (hasPrerequisite && !completedUnits.includes(unit.prerequisiteUnitId!)) {
                  iconStyle = 'bg-gradient-to-br from-yellow-500 to-yellow-600';
                }
                
                return (
                  <div key={unit.id} className="mb-2">
                    {hasPrerequisite && prerequisiteUnit && (
                      <div className="ml-6 mb-1 flex items-center">
                        <div className="w-0.5 h-4 bg-gray-300"></div>
                        <div className="ml-2 text-xs text-gray-500">
                          Yêu cầu hoàn thành: {prerequisiteUnit.title}
                        </div>
                      </div>
                    )}
                    <button 
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${buttonStyle}`}
                      onClick={() => toggleUnitExpand(unit.id)}
                      disabled={hasPrerequisite && !completedUnits.includes(unit.prerequisiteUnitId!)}
                    >
                      <div className={`p-2 rounded-lg ${iconStyle} text-white`}
                      >
                        {isCompleted ? 
                          <CheckCircle className="h-4 w-4" /> : 
                          getUnitIcon()
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{unit.title}</h4>
                      </div>

                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ArrowLeft className="h-4 w-4 rotate-90" />
                      </div>
                    </button>

                    {/* Unit Materials Dropdown */}
                    {isExpanded && (
                      <div className="ml-8 mt-2 space-y-1 border-l-2 border-gray-100 pl-3">
                        {unit.materials && unit.materials.length > 0 ? (
                          unit.materials.map((material) => {
                            // Determine icon based on material type
                            const getMaterialIcon = () => {
                              switch (material.type) {
                                case 'VOCAB':
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                      <BookOpen className="h-3 w-3 text-blue-600" />
                                    </div>
                                  );
                                case 'GRAMMAR':
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                      <FileText className="h-3 w-3 text-green-600" />
                                    </div>
                                  );
                                case 'LISTENING':
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                      <Languages className="h-3 w-3 text-purple-600" />
                                    </div>
                                  );
                                case 'SPEAKING':
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                      <Languages className="h-3 w-3 text-orange-600" />
                                    </div>
                                  );
                                case 'READING':
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                      <Languages className="h-3 w-3 text-red-600" />
                                    </div>
                                  );
                                default:
                                  return (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                      <FileText className="h-3 w-3 text-gray-600" />
                                    </div>
                                  );
                              }
                            };

                            return (
                              <button 
                                key={material.id}
                                className="w-full text-left flex items-center gap-2 py-2 px-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                                onClick={() => setSelectedMaterial(material)}
                              >
                                {getMaterialIcon()}
                                {material.description}
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-2 px-3 text-sm text-gray-500 italic">
                            Không có tài liệu cho đơn vị này
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {chapter.exams && chapter.exams.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bài kiểm tra chương</h3>
                
                <div className="space-y-3">
                  {chapter.exams.map((exam) => (
                    <button
                      key={exam.id}
                      className="w-full text-left flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      onClick={() => handleExamClick(exam.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">{exam.description}</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                        {isEnrolled ? "Làm bài" : "Đăng ký để làm bài"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Content - PDF Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-100 p-6">
            <div className="bg-white h-full shadow-lg rounded-lg overflow-hidden flex flex-col">
              {/* PDF Toolbar */}
              <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Tài liệu học tập</h3>
                  <div className="text-sm text-gray-300">
                    <span>Trang 1 / 10</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="text-white hover:bg-gray-700 p-2 rounded-full">
                    <ArrowLeft className="h-4 w-4 rotate-90" />
                  </button>
                  <span className="text-sm px-2">100%</span>
                  <button className="text-white hover:bg-gray-700 p-2 rounded-full">
                    <ArrowLeft className="h-4 w-4 -rotate-90" />
                  </button>
                  <div className="w-px h-6 bg-gray-600 mx-2" />
                  <button className="text-white hover:bg-gray-700 p-2 rounded-full">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 flex items-center justify-center">
                {selectedMaterial ? (
                  renderMaterialContent()
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-6 mx-auto">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tài liệu học tập</h3>
                    <p className="text-gray-600 mb-6">
                      Chọn tài liệu từ danh sách bên trái để xem nội dung
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Mẹo:</strong> Mở rộng đơn vị học để xem danh sách tài liệu có sẵn.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" />
                Kỹ năng trước
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90">
                Kỹ năng tiếp theo
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Learning Path */}
        <div className="w-72 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Lộ trình học tập</h2>
            <p className="text-sm text-gray-600">Tiến độ và học liệu tham khảo</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Chapter Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Tiến độ chương học</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                  <span className="font-bold text-gray-900">{Math.round((completedUnits.length / (chapter?.units?.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.round((completedUnits.length / (chapter?.units?.length || 1)) * 100)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {completedUnits.length} / {chapter?.units?.length || 0} bài học hoàn thành
                </div>

                {!isEnrolled && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      Đăng ký khóa học để theo dõi tiến độ và nhận chứng chỉ khi hoàn thành.
                    </p>
                    <button className="w-full mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                      Đăng ký khóa học
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Related Materials */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Tài liệu tham khảo</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-800">Từ vựng và ngữ pháp chương {chapter?.title?.split(':')[0]}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <div className="p-2 rounded-lg bg-green-100">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-800">Bảng động từ và các mẫu câu</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-800">Bài tập bổ sung</span>
                </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-4 border border-blue-100">
              <h3 className="text-base font-bold text-gray-900 mb-2">Bạn cần hỗ trợ?</h3>
              <p className="text-gray-700 text-sm mb-3">
                Nếu bạn gặp khó khăn trong quá trình học, đừng ngần ngại liên hệ với giáo viên hoặc hỗ trợ viên.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Yêu cầu hỗ trợ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
