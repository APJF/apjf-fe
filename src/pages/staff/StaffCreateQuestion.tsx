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
  Minus
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
  options: QuestionOption[];
  unitIds: string[];
}

export function StaffCreateQuestion() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nextOptionId, setNextOptionId] = useState(1); // Counter for option IDs
  const { showToast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters - chỉ giữ questionId search và unitId filter
  const [searchQuestionId, setSearchQuestionId] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");

  // Validation functions
  const validateQuestionId = (value: string): string => {
    if (!value.trim()) {
      return 'ID câu hỏi là bắt buộc';
    }
    if (value.includes(' ')) {
      return 'ID câu hỏi không được chứa khoảng trắng';
    }
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return 'ID câu hỏi chỉ được chứa chữ cái, số, dấu gạch dưới và gạch ngang';
    }
    return '';
  };

  const handleQuestionIdChange = (value: string) => {
    // Update form data
    setFormData(prev => {
      // Update question ID and regenerate option IDs if creating new question
      const updatedOptions = !editingQuestion && prev.options.length > 0 && value
        ? prev.options.map((option) => {
            // Extract the number part from the option ID and combine with new question ID
            const optionNumber = option.id.split('-').pop() || option.id;
            return {
              ...option,
              id: `${value}-${optionNumber}`
            };
          })
        : prev.options;

      return {
        ...prev,
        id: value,
        options: updatedOptions
      };
    });

    // Clear error when user starts typing
    if (errors.questionId) {
      setErrors(prev => ({ ...prev, questionId: '' }));
    }

    // Real-time validation
    const trimmedValue = value.trim();
    if (value !== trimmedValue || value.includes(' ')) {
      setErrors(prev => ({ ...prev, questionId: 'ID câu hỏi không được chứa khoảng trắng' }));
    } else {
      const error = validateQuestionId(value);
      if (error) {
        setErrors(prev => ({ ...prev, questionId: error }));
      }
    }
  };

  // Form data
  const [formData, setFormData] = useState<FormData>({
    id: '',
    content: '',
    scope: 'KANJI',
    type: 'MULTIPLE_CHOICE',
    explanation: '',
    options: [
      { id: '1', content: '', isCorrect: true },
      { id: '2', content: '', isCorrect: false }
    ],
    unitIds: []
  });

  useEffect(() => {
    fetchUnits(); // Load units initially
  }, []);

  // useEffect để reset currentPage về 0 khi search hoặc filter thay đổi
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuestionId, unitFilter]);
  
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchQuestions(currentPage, pageSize, searchQuestionId, unitFilter);
    }, 300); // Debounce search
    
    return () => clearTimeout(delayedFetch);
  }, [currentPage, pageSize, searchQuestionId, unitFilter]);

  const fetchQuestions = async (
    page: number = 0, 
    size: number = 10,
    questionId?: string,
    unitId?: string
  ) => {
    try {
      setLoading(true);
      
      // Prepare filters
      const questionIdParam = questionId?.trim() || undefined;
      const unitIdParam = unitId === "all" ? undefined : unitId;
      
      const pagedData = await QuestionService.getAllQuestions(
        page, 
        size, 
        questionIdParam, 
        unitIdParam
      );
      console.log('Paged questions data received:', pagedData);
      
      // pagedData is now PagedQuestions type with all pagination info
      const safeQuestionsData = Array.isArray(pagedData.content) ? pagedData.content : [];
      setQuestions(safeQuestionsData);
      
      // Set pagination info from PagedQuestions - chỉ cập nhật currentPage nếu khác với request
      
      setTotalPages(pagedData.totalPages);
      setTotalElements(pagedData.totalElements);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      showToast('error', error.message);
      setQuestions([]); // Set empty array on error
      setTotalPages(0);
      setTotalElements(0);
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

  // Use questions directly since pagination is handled by backend
  const safeQuestions = Array.isArray(questions) ? questions : [];
  
  // Stats need to be calculated from totalElements, not filtered questions
  const stats = {
    total: totalElements,
    multipleChoice: safeQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").length,
    trueFalse: safeQuestions.filter((q) => q.type === "TRUE_FALSE").length,
    writing: safeQuestions.filter((q) => q.type === "WRITING").length,
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const handleCreateQuestion = async (questionData: FormData) => {
    try {
      // Step 1: Create the question (without options in the request)
      const createData: CreateQuestionRequest = {
        id: questionData.id,
        content: questionData.content,
        scope: questionData.scope,
        type: questionData.type,
        explanation: questionData.explanation,
        fileUrl: null, // Luôn set null như yêu cầu
        options: [], // Empty options array since we'll create them separately
        unitIds: questionData.unitIds
      };

      await QuestionService.createQuestion(createData);

      // Step 2: Create each option separately
      if (questionData.type === 'MULTIPLE_CHOICE' && questionData.options.length > 0) {
        for (const option of questionData.options) {
          const optionData = {
            id: option.id, // Use the ID that was generated in the form
            content: option.content,
            isCorrect: option.isCorrect
          };

          await QuestionService.createQuestionOption(questionData.id, optionData);
        }
      }

      showToast('success', 'Tạo câu hỏi và các lựa chọn thành công!');
      setShowQuestionDialog(false);
      resetForm();
      // Refresh current page with current filters
      fetchQuestions(currentPage, pageSize, searchQuestionId, unitFilter);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleUpdateQuestion = async (id: string, questionData: FormData) => {
    try {
      // Step 1: Update the question (without options in the request)
      const updateData: CreateQuestionRequest = {
        id: questionData.id,
        content: questionData.content,
        scope: questionData.scope,
        type: questionData.type,
        explanation: questionData.explanation,
        fileUrl: null,
        options: [], // Empty options array since we'll update them separately
        unitIds: questionData.unitIds
      };

      await QuestionService.updateQuestion(id, updateData);

      // Step 2: Smart option management - compare with original question
      if (questionData.type === 'MULTIPLE_CHOICE' && editingQuestion) {
        const originalOptions = editingQuestion.options || [];
        const currentOptions = questionData.options;
        
        // Find options to delete (in original but not in current)
        const optionsToDelete = originalOptions.filter(original => 
          !currentOptions.some(current => current.id === original.id)
        );
        
        // Find options to create (truly new ones - not in original options)
        const optionsToCreate = currentOptions.filter(current => 
          !originalOptions.some(original => original.id === current.id)
        );
        
        // Find options to update (existing ones with changes)
        const optionsToUpdate = currentOptions.filter(current => {
          const original = originalOptions.find(orig => orig.id === current.id);
          return original && (
            original.content !== current.content || 
            original.isCorrect !== current.isCorrect
          );
        });

        console.log('Options to delete:', optionsToDelete);
        console.log('Options to create:', optionsToCreate);
        console.log('Options to update:', optionsToUpdate);

        // Execute deletions first
        for (const option of optionsToDelete) {
          await QuestionService.deleteQuestionOption(option.id);
        }

        // Execute creations for truly new options
        for (const option of optionsToCreate) {
          const optionData = {
            id: option.id, // Use the ID that was generated when adding the option
            content: option.content,
            isCorrect: option.isCorrect
          };
          await QuestionService.createQuestionOption(questionData.id, optionData);
        }

        // Execute updates for existing options
        for (const option of optionsToUpdate) {
          const optionData = {
            id: option.id, // Keep the original ID
            content: option.content,
            isCorrect: option.isCorrect
          };
          await QuestionService.updateQuestionOption(option.id, optionData);
        }
      }

      showToast('success', 'Cập nhật câu hỏi và các lựa chọn thành công!');
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      resetForm();
      // Refresh current page with current filters
      fetchQuestions(currentPage, pageSize, searchQuestionId, unitFilter);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await QuestionService.deleteQuestion(id);
      showToast('success', 'Xóa câu hỏi thành công!');
      setShowDeleteDialog(null);
      // Refresh current page with current filters
      fetchQuestions(currentPage, pageSize, searchQuestionId, unitFilter);
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
      options: [
        { id: '1', content: '', isCorrect: true },
        { id: '2', content: '', isCorrect: false }
      ],
      unitIds: []
    });
    setErrors({}); // Clear all errors
    setNextOptionId(3); // Reset counter to 3 since we have options 1 and 2
  };

  const openEditDialog = async (question: Question) => {
    try {
      setLoadingQuestion(true);
      
      // Kết hợp dữ liệu từ 2 nguồn:
      // 1. question từ list (có thông tin đáp án đúng)
      // 2. fullQuestion từ detail API (có đầy đủ thông tin khác như units)
      console.log('Question from list (có correct answers):', question);
      
      // Fetch full question details to get complete data including units
      console.log('Fetching question details for ID:', question.id);
      const fullQuestion = await QuestionService.getQuestionById(question.id);
      console.log('Full question from detail API:', fullQuestion);
      
      // Combine options: use options from list (với isCorrect) nhưng ensure có đầy đủ fields
      const combinedOptions = question.options?.map((listOption, index) => ({
        id: listOption.id || `${question.id}-${index + 1}`,
        content: listOption.content || '',
        isCorrect: listOption.isCorrect // Lấy isCorrect từ list data
      })) || [];
      
      // Nếu fullQuestion có options mà list không có, merge chúng
      if (fullQuestion.options && fullQuestion.options.length > 0) {
        fullQuestion.options.forEach((detailOption) => {
          const existingOption = combinedOptions.find(opt => opt.id === detailOption.id);
          if (!existingOption) {
            // Option mới từ detail API, add vào (nhưng cần xác định isCorrect từ list)
            const listMatch = question.options?.find(opt => opt.content === detailOption.content);
            combinedOptions.push({
              id: detailOption.id || `${question.id}-${combinedOptions.length + 1}`,
              content: detailOption.content || '',
              isCorrect: listMatch?.isCorrect || false
            });
          } else {
            // Update content từ detail API nhưng giữ nguyên isCorrect từ list
            existingOption.content = detailOption.content || '';
          }
        });
      }

      // Ensure unitIds is always an array (lấy từ detail API)
      const safeUnitIds = Array.isArray(fullQuestion.unitIds) ? fullQuestion.unitIds : [];
      
      console.log('Combined options with correct answers:', combinedOptions);
      console.log('Safe unitIds from detail API:', safeUnitIds);

      setFormData({
        id: fullQuestion.id || question.id || '',
        content: fullQuestion.content || question.content || '',
        scope: fullQuestion.scope || question.scope,
        type: fullQuestion.type || question.type,
        explanation: fullQuestion.explanation || question.explanation || '',
        options: combinedOptions,
        unitIds: safeUnitIds
      });
      
      // Set nextOptionId to be higher than the highest existing option ID
      const maxOptionId = combinedOptions.reduce((max, option) => {
        const optionIdNumber = parseInt(option.id.split('-').pop() || '0');
        return Math.max(max, optionIdNumber);
      }, 0);
      setNextOptionId(maxOptionId + 1);
      
      // Use combined data for editingQuestion
      const combinedQuestion = {
        ...fullQuestion,
        options: combinedOptions,
        // Fallback values from list data
        id: fullQuestion.id || question.id || '',
        content: fullQuestion.content || question.content || '',
        scope: fullQuestion.scope || question.scope,
        type: fullQuestion.type || question.type,
        explanation: fullQuestion.explanation || question.explanation || ''
      };
      
      setEditingQuestion(combinedQuestion);
      setShowQuestionDialog(true);
    } catch (error: any) {
      console.error('Error fetching question details:', error);
      showToast('error', error.message || 'Không thể tải chi tiết câu hỏi');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingQuestion(null);
    setShowQuestionDialog(true);
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      const optionId = formData.id ? `${formData.id}-${nextOptionId}` : nextOptionId.toString();
      
      // Only update local state - API calls will happen on save
      setFormData(prev => {
        const newOptions = [...prev.options, { 
          id: optionId, 
          content: '', 
          isCorrect: false 
        }];
        
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
      
      // Increment counter for next option
      setNextOptionId(prev => prev + 1);
    }
  };

  const removeOption = (optionId: string) => {
    if (formData.options.length > 2) {
      // Only update local state - API calls will happen on save
      setFormData(prev => {
        const remainingOptions = prev.options.filter(opt => opt.id !== optionId);
        
        // If the removed option was correct, set the first remaining option as correct
        const removedOption = prev.options.find(opt => opt.id === optionId);
        if (removedOption?.isCorrect && remainingOptions.length > 0) {
          remainingOptions[0].isCorrect = true;
        }
        
        return {
          ...prev,
          options: remainingOptions
        };
      });
    }
  };

  const updateOption = (optionId: string, content: string) => {
    // Only update local state - API calls will happen on save
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === optionId ? { ...opt, content } : opt)
    }));
  };

  const setCorrectOption = (optionId: string) => {
    // Only update local state - API calls will happen on save
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => ({ ...opt, isCorrect: opt.id === optionId }))
    }));
  };

  const handleSave = () => {
    // Enhanced validation following course creation patterns
    if (!formData.id.trim()) {
      showToast('error', 'ID câu hỏi là bắt buộc');
      return;
    }

    // Validate questionId format (no spaces, alphanumeric with underscore and dash)
    if (formData.id.includes(' ')) {
      showToast('error', 'ID câu hỏi không được chứa khoảng trắng');
      return;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(formData.id)) {
      showToast('error', 'ID câu hỏi chỉ được chứa chữ cái, số, dấu gạch dưới và gạch ngang');
      return;
    }

    if (!formData.content.trim()) {
      showToast('error', 'Nội dung câu hỏi là bắt buộc');
      return;
    }

    // Validate units selection
    if (!formData.unitIds || formData.unitIds.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất một đơn vị học');
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
        showToast('error', 'Vui lòng điền đầy đủ nội dung các lựa chọn');
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
                      placeholder="Tìm kiếm theo Question ID..."
                      value={searchQuestionId}
                      onChange={(e) => setSearchQuestionId(e.target.value)}
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
                </div>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <Card className="bg-white/90  shadow-xl border-0">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
              <h3 className="text-lg font-semibold">Danh sách câu hỏi ({safeQuestions.length})</h3>
            </div>
            <div className="p-6">
              {(() => {
                if (loading) {
                  return (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Đang tải...</p>
                    </div>
                  );
                }
                
                if (safeQuestions.length === 0) {
                  return (
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
                  );
                }
                
                return (
                <div className="space-y-4">
                  {safeQuestions.map((question: Question, index: number) => {
                    // Ensure unitIds is always an array for safety
                    const safeQuestion = {
                      ...question,
                      unitIds: Array.isArray(question.unitIds) ? question.unitIds : []
                    };
                    
                    return (
                      <div key={safeQuestion.id} className="border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getQuestionTypeIcon(safeQuestion.type)}
                              <Badge className="bg-blue-100 text-blue-800">
                                {getQuestionTypeName(safeQuestion.type)}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                {getScopeName(safeQuestion.scope)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(safeQuestion)}
                              disabled={loadingQuestion}
                              className="text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingQuestion ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteDialog(safeQuestion.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <h4 
                          className="font-medium text-gray-900 mb-2"
                          dangerouslySetInnerHTML={{
                            __html: safeQuestion.content
                              .replace(/<u>/g, '<span style="text-decoration: underline;">')
                              .replace(/<\/u>/g, '</span>')
                              .replace(/<strong>/g, '<span style="font-weight: bold;">')
                              .replace(/<\/strong>/g, '</span>')
                              .replace(/<em>/g, '<span style="font-style: italic;">')
                              .replace(/<\/em>/g, '</span>')
                          }}
                        />

                        {safeQuestion.type === "MULTIPLE_CHOICE" && safeQuestion.options && (
                          <div className="space-y-1 mb-2">
                            {safeQuestion.options.map((option, optionIndex) => (
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

                        {safeQuestion.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <strong>Giải thích:</strong> {safeQuestion.explanation}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          Tạo: {new Date(safeQuestion.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} câu hỏi
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Page size selector */}
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                    </select>
                    
                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(0)}
                        disabled={currentPage === 0}
                        className="px-2 py-1"
                      >
                        ««
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-2 py-1"
                      >
                        ‹
                      </Button>
                      
                      {/* Page numbers */}
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(0, currentPage - 2);
                        const endPage = Math.min(totalPages - 1, currentPage + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={i === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-1 ${i === currentPage ? 'bg-blue-600 text-white' : ''}`}
                            >
                              {i + 1}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-2 py-1"
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages - 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-2 py-1"
                      >
                        »»
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
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
                <div>
                  <label htmlFor="questionId" className="block text-sm font-medium text-gray-700 mb-1">
                    ID câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="questionId"
                    value={formData.id}
                    onChange={(e) => handleQuestionIdChange(e.target.value)}
                    placeholder="Nhập ID câu hỏi"
                    className={`bg-white/70 ${errors.questionId ? 'border-red-500' : ''}`}
                    maxLength={40}
                  />
                  <div className={`text-xs mt-1 ${(formData.id || '').length >= 32 ? 'text-red-500' : 'text-gray-500'}`}>
                    {(formData.id || '').length}/40 ký tự
                  </div>
                  {errors.questionId && (
                    <p className="mt-1 text-sm text-red-600">{errors.questionId}</p>
                  )}
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
                    maxLength={255}
                  />
                  <div className={`text-xs mt-1 ${(formData.content || '').length >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {(formData.content || '').length}/255 ký tự
                  </div>
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
                          maxLength={255}
                        />
                        <div className={`text-xs ${(option.content || '').length >= 200 ? 'text-red-500' : 'text-gray-500'} whitespace-nowrap ml-2`}>
                          {(option.content || '').length}/255
                        </div>
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
                    multiple={false}
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
                    maxLength={255}
                  />
                  <div className={`text-xs mt-1 ${(formData.explanation || '').length >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {(formData.explanation || '').length}/255 ký tự
                  </div>
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
