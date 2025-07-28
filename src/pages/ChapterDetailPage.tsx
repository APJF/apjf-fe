import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChapterById, getUnitsByChapterId } from '@/services/chapterDetailService';
import type { Chapter, Unit } from '@/types/course';
import { ArrowLeft, PlayCircle, FileText, Clock } from 'lucide-react';

export default function ChapterDetailPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (chapterId) {
      const fetchChapterData = async () => {
        try {
          setLoading(true);
          const [chapterRes, unitsRes] = await Promise.all([
            getChapterById(chapterId),
            getUnitsByChapterId(chapterId),
          ]);

          if (chapterRes.success) {
            setChapter(chapterRes.data);
          } else {
            setError(chapterRes.message);
          }

          if (unitsRes.success) {
            setUnits(unitsRes.data);
            if (unitsRes.data.length > 0) {
              setSelectedUnit(unitsRes.data[0]);
            }
          } else {
            console.error('Error fetching units:', unitsRes.message);
          }
        } catch (err) {
          setError('Failed to fetch chapter details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchChapterData();
    }
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-700 font-medium">Đang tải nội dung chương học...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(0)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div>Chapter not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/courses/${chapter?.courseId}`)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} />
                <span>Về trang khóa học</span>
              </button>
              <h1 className="text-lg font-semibold text-gray-800 truncate mt-1">{chapter.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {selectedUnit ? (
                  <div className="text-white text-center">
                    <PlayCircle size={64} />
                    <p className="mt-4 text-xl">Nội dung bài học: {selectedUnit.title}</p>
                    <p className="text-gray-400 mt-2">Đây là khu vực hiển thị video hoặc nội dung bài học.</p>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <p>Vui lòng chọn một bài học</p>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedUnit?.title}</h2>
                <p className="text-gray-600 mt-2">{selectedUnit?.description || 'Chưa có mô tả cho bài học này.'}</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 px-2 mb-2">Danh sách bài học</h3>
              <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {units.length > 0 ? (
                  units.map((unit, index) => (
                    <button
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${
                        selectedUnit?.id === unit.id
                          ? 'bg-red-100 text-red-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <FileText
                          size={18}
                          className={`${selectedUnit?.id === unit.id ? 'text-red-600' : 'text-gray-500'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{`Bài ${index + 1}: ${unit.title}`}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock size={12} />
                          <span>10 phút</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 p-3">Chương này chưa có bài học nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
