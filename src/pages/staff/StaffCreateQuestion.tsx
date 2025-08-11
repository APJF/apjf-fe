import { useState, useEffect } from 'react';
import { StaffNavigation } from '../../components/layout/StaffNavigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { UnitSelector } from '../../components/ui/UnitSelector';
import { useToast } from '../../hooks/useToast';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  Minus,
  Upload
} from 'lucide-react';
import type { Question, CreateQuestionRequest, QuestionOption } from '../../types/question';
import { QuestionService } from '../../services/questionService';
import { UnitService, type Unit } from '../../services/unitService';

interface FormData {
  id: string;
  content: string;
  scope: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING';
  explanation: string;
  fileUrl: string;
  uploadedFile: File | null;
  options: QuestionOption[];
  unitIds: string[];
}

export function StaffCreateQuestion() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const { showToast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");

  // Form data
  const [formData, setFormData] = useState<FormData>({
    id: '',
    content: '',
    scope: 'KANJI',
    type: 'MULTIPLE_CHOICE',
    explanation: '',
    fileUrl: '',
    uploadedFile: null,
    options: [
      { id: '1', content: '', isCorrect: true },
      { id: '2', content: '', isCorrect: false }
    ],
    unitIds: []
  });

  useEffect(() => {
    fetchQuestions();
    fetchUnits();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await QuestionService.getAllQuestions();
      setQuestions(questionsData);
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const unitsData = await UnitService.getAllUnits();
      setUnits(unitsData);
    } catch (error: any) {
      console.error('Error fetching units:', error);
      // Fallback to mock data on error
      setUnits([
        { id: 'ut1', title: 'Unit 1: Hiragana cơ bản', chapterId: 'ch1', courseId: 'c1' },
        { id: 'ut2', title: 'Unit 2: Katakana cơ bản', chapterId: 'ch1', courseId: 'c1' },
        { id: 'ut3', title: 'Unit 3: Kanji cơ bản', chapterId: 'ch2', courseId: 'c1' }
      ]);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === "all" || question.unitIds.includes(unitFilter);
    const matchesType = typeFilter === "all" || question.type === typeFilter;
    const matchesScope = scopeFilter === "all" || question.scope === scopeFilter;
    return matchesSearch && matchesUnit && matchesType && matchesScope;
  });

  const handleCreateQuestion = async (questionData: FormData) => {
    try {
      const createData: CreateQuestionRequest = {
        id: questionData.id,
        content: questionData.content,
        scope: questionData.scope,
        type: questionData.type,
        explanation: questionData.explanation,
        fileUrl: null, // Luôn set null như yêu cầu
        options: questionData.options,
        unitIds: questionData.unitIds
      };

      const newQuestion = await QuestionService.createQuestion(createData);
      setQuestions(prev => [newQuestion, ...prev]);
      showToast('success', 'Tạo câu hỏi thành công!');
      setShowQuestionDialog(false);
      resetForm();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleUpdateQuestion = async (id: string, questionData: FormData) => {
    try {
      const updateData: CreateQuestionRequest = {
        id: questionData.id,
        content: questionData.content,
        scope: questionData.scope,
        type: questionData.type,
        explanation: questionData.explanation,
        fileUrl: null,
        options: questionData.options,
        unitIds: questionData.unitIds
      };

      const updatedQuestion = await QuestionService.updateQuestion(id, updateData);
      setQuestions(prev => prev.map(q => q.id === id ? updatedQuestion : q));
      showToast('success', 'Cập nhật câu hỏi thành công!');
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      resetForm();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await QuestionService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('success', 'Xóa câu hỏi thành công!');
      setShowDeleteDialog(null);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      content: '',
      scope: 'KANJI',
      type: 'MULTIPLE_CHOICE',
      explanation: '',
      fileUrl: '',
      uploadedFile: null,
      options: [
        { id: '1', content: '', isCorrect: true },
        { id: '2', content: '', isCorrect: false }
      ],
      unitIds: []
    });
  };

  const openEditDialog = (question: Question) => {
    setFormData({
      id: question.id,
      content: question.content,
      scope: question.scope,
      type: question.type,
      explanation: question.explanation,
      fileUrl: question.fileUrl || '',
      uploadedFile: null,
      options: question.options,
      unitIds: question.unitIds
    });
    setEditingQuestion(question);
    setShowQuestionDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingQuestion(null);
    setShowQuestionDialog(true);
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => {
        const newOptions = [...prev.options, { id: (prev.options.length + 1).toString(), content: '', isCorrect: false }];
        // Nếu chưa có đáp án đúng nào, chọn option đầu tiên làm đáp án đúng
        const hasCorrectAnswer = newOptions.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer && newOptions.length > 0) {
          newOptions[0].isCorrect = true;
        }
        return {
          ...prev,
          options: newOptions
        };
      });
    }
  };

  const removeOption = (optionId: string) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== optionId)
      }));
    }
  };

  const updateOption = (optionId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === optionId ? { ...opt, content } : opt)
    }));
  };

  const setCorrectOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => ({ ...opt, isCorrect: opt.id === optionId }))
    }));
  };

  const handleSave = () => {
    // Validation
    if (!formData.id.trim()) {
      showToast('error', 'Vui lòng nhập ID câu hỏi');
      return;
    }

    if (!formData.content.trim()) {
      showToast('error', 'Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect);
      const hasEmptyOption = formData.options.some(opt => !opt.content.trim());

      if (!hasCorrectAnswer) {
        showToast('error', 'Vui lòng chọn đáp án đúng');
        return;
      }

      if (hasEmptyOption) {
        showToast('error', 'Vui lòng điền đầy đủ các lựa chọn');
        return;
      }
    }

    if (editingQuestion) {
      handleUpdateQuestion(editingQuestion.id, formData);
    } else {
      handleCreateQuestion(formData);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "TRUE_FALSE":
        return <XCircle className="h-4 w-4 text-green-600" />;
      case "WRITING":
        return <Edit className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getQuestionTypeName = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Trắc nghiệm";
      case "TRUE_FALSE":
        return "Đúng/Sai";
      case "WRITING":
        return "Tự luận";
      default:
        return "Khác";
    }
  };

  const getScopeName = (scope: string) => {
    switch (scope) {
      case "KANJI":
        return "Kanji";
      case "VOCAB":
        return "Từ vựng";
      case "GRAMMAR":
        return "Ngữ pháp";
      case "LISTENING":
        return "Nghe";
      case "READING":
        return "Đọc";
      case "WRITING":
        return "Viết";
      default:
        return scope;
    }
  };

  const stats = {
    total: questions.length,
    multipleChoice: questions.filter((q) => q.type === "MULTIPLE_CHOICE").length,
    trueFalse: questions.filter((q) => q.type === "TRUE_FALSE").length,
    writing: questions.filter((q) => q.type === "WRITING").length,
  };

  return (
    <StaffNavigation>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý câu hỏi</h1>
              <p className="text-gray-600">Tạo và quản lý câu hỏi cho bài kiểm tra</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={openCreateDialog}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tổng câu hỏi</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Trắc nghiệm</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.multipleChoice}</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Đúng/Sai</p>
                    <p className="text-2xl font-bold text-green-600">{stats.trueFalse}</p>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tự luận</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.writing}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm câu hỏi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-64">
                    <UnitSelector
                      units={units}
                      selectedUnitIds={unitFilter === "all" ? [] : [unitFilter]}
                      onChange={(unitIds) => setUnitFilter(unitIds.length > 0 ? unitIds[0] : "all")}
                      placeholder="Tất cả units"
                      multiple={false}
                      required={false}
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="TRUE_FALSE">Đúng/Sai</option>
                    <option value="WRITING">Tự luận</option>
                  </select>
                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả phạm vi</option>
                    <option value="KANJI">Kanji</option>
                    <option value="VOCAB">Từ vựng</option>
                    <option value="GRAMMAR">Ngữ pháp</option>
                    <option value="LISTENING">Nghe</option>
                    <option value="READING">Đọc</option>
                    <option value="WRITING">Viết</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <Card className="bg-white/90  shadow-xl border-0">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
              <h3 className="text-lg font-semibold">Danh sách câu hỏi ({filteredQuestions.length})</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có câu hỏi nào</h3>
                  <p className="text-gray-600 mb-4">Bắt đầu tạo câu hỏi đầu tiên</p>
                  <Button
                    onClick={openCreateDialog}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm câu hỏi đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map((question, index) => (
                    <div key={question.id} className="border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getQuestionTypeIcon(question.type)}
                            <Badge className="bg-blue-100 text-blue-800">
                              {getQuestionTypeName(question.type)}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">
                              {getScopeName(question.scope)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(question)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteDialog(question.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <h4 
                        className="font-medium text-gray-900 mb-2"
                        dangerouslySetInnerHTML={{
                          __html: question.content
                            .replace(/<u>/g, '<span style="text-decoration: underline;">')
                            .replace(/<\/u>/g, '</span>')
                            .replace(/<strong>/g, '<span style="font-weight: bold;">')
                            .replace(/<\/strong>/g, '</span>')
                            .replace(/<em>/g, '<span style="font-style: italic;">')
                            .replace(/<\/em>/g, '</span>')
                        }}
                      />

                      {question.type === "MULTIPLE_CHOICE" && question.options && (
                        <div className="space-y-1 mb-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className={`text-sm p-2 rounded ${
                                option.isCorrect ? "bg-green-50 text-green-800 border border-green-200" : "text-gray-600"
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                              {option.content}
                              {option.isCorrect && <CheckCircle className="h-3 w-3 inline ml-2 text-green-600" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>Giải thích:</strong> {question.explanation}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        Tạo: {new Date(question.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Question Dialog */}
        {showQuestionDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4 w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
                <h3 className="text-lg font-semibold">
                  {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="questionId" className="block text-sm font-medium text-gray-700 mb-1">
                      ID câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="questionId"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="Nhập ID câu hỏi"
                      className="bg-white/70"
                    />
                  </div>
                  <div>
                    <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
                      File đính kèm
                    </label>
                    <div className="relative">
                      <input
                        id="fileUpload"
                        type="file"
                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData(prev => ({ ...prev, uploadedFile: file }));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                        <span className="text-gray-500 text-sm">
                          {formData.uploadedFile?.name ?? 'Chọn file...'}
                        </span>
                        <Upload className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type and Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                      Trắc nghiệm
                    </div>
                  </div>
                  <div>
                    <label htmlFor="questionScope" className="block text-sm font-medium text-gray-700 mb-1">Phạm vi</label>
                    <select
                      id="questionScope"
                      value={formData.scope}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        scope: e.target.value as 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="KANJI">Kanji</option>
                      <option value="VOCAB">Từ vựng</option>
                      <option value="GRAMMAR">Ngữ pháp</option>
                      <option value="LISTENING">Nghe</option>
                      <option value="READING">Đọc</option>
                      <option value="WRITING">Viết</option>
                    </select>
                  </div>
                </div>

                {/* Question Content */}
                <div>
                  <label htmlFor="questionContent" className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="questionContent"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>

                {/* Multiple Choice Options */}
                {formData.type === "MULTIPLE_CHOICE" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="block text-sm font-medium text-gray-700">Các lựa chọn</div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={addOption}
                          disabled={formData.options.length >= 6}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                    {formData.options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-3 mb-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => setCorrectOption(option.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{String.fromCharCode(65 + index)}</span>
                        </div>
                        <Input
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                          value={option.content}
                          onChange={(e) => updateOption(option.id, e.target.value)}
                          className="flex-1 bg-white/70"
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => removeOption(option.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Unit Selection */}
                <div>
                  <UnitSelector
                    units={units}
                    selectedUnitIds={formData.unitIds}
                    onChange={(unitIds) => setFormData(prev => ({ ...prev, unitIds }))}
                    placeholder="Tìm kiếm và chọn units (tùy chọn)..."
                    multiple={true}
                    required={false}
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label htmlFor="questionExplanation" className="block text-sm font-medium text-gray-700 mb-1">Giải thích (tùy chọn)</label>
                  <textarea
                    id="questionExplanation"
                    value={formData.explanation}
                    onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Giải thích đáp án cho học viên..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50/50 rounded-b-xl">
                <Button
                  onClick={() => setShowQuestionDialog(false)}
                  variant="outline"
                  className="bg-white/70"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {editingQuestion ? "Cập nhật" : "Thêm câu hỏi"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 m-4 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Xác nhận xóa câu hỏi</h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowDeleteDialog(null)}
                  variant="outline"
                  className="bg-white/70"
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => showDeleteDialog && handleDeleteQuestion(showDeleteDialog)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa câu hỏi
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffNavigation>
  );
}
