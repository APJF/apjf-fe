import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import ApprovalRequestService from '../services/approvalRequestService';
import type { ApprovalRequest } from '../types/approvalRequest';

// Component hiển thị thông tin cơ bản của request
const RequestCard: React.FC<{
  request: ApprovalRequest;
  onApprove: (id: number, feedback?: string) => void;
  onReject: (id: number, feedback: string) => void;
  isLoading: boolean;
}> = ({ request, onApprove, onReject, isLoading }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600">Chờ duyệt</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="border-green-400 text-green-600">Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTargetTypeName = (type: string) => {
    switch (type) {
      case 'COURSE':
        return 'Khóa học';
      case 'CHAPTER':
        return 'Chương';
      case 'UNIT':
        return 'Bài học';
      default:
        return type;
    }
  };

  const handleApprove = () => {
    setFeedbackError('');
    onApprove(request.id, feedback);
    setShowFeedback(false);
    setFeedback('');
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      setFeedbackError('Vui lòng nhập lý do từ chối');
      return;
    }
    setFeedbackError('');
    onReject(request.id, feedback);
    setShowFeedback(false);
    setFeedback('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{request.targetTitle}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Loại:</span>
            <Badge variant="outline">{getTargetTypeName(request.targetType)}</Badge>
            {getStatusBadge(request.decision)}
          </div>
          <div className="text-sm text-gray-600">
            <p>Tạo bởi: <span className="font-medium">{request.createdBy}</span></p>
            <p>Thời gian: {formatDate(request.createdAt)}</p>
            {request.reviewedAt && (
              <p>Đã xem xét: {formatDate(request.reviewedAt)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tạm thời bỏ description vì không có trong type */}

      {request.feedback && (
        <div className="space-y-2">
          <h4 className="font-medium">Phản hồi:</h4>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            {request.feedback}
          </p>
        </div>
      )}

      {request.decision === 'PENDING' && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowFeedback(!showFeedback)}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {showFeedback ? 'Ẩn' : 'Thêm phản hồi'}
            </Button>
            <Button
              onClick={() => onApprove(request.id)}
              variant="default"
              size="sm"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Đang xử lý...' : 'Phê duyệt'}
            </Button>
          </div>

          {showFeedback && (
            <div className="space-y-3 p-4 bg-gray-50 rounded">
              <div>
                <label htmlFor="feedback-textarea" className="block text-sm font-medium mb-2">
                  Phản hồi (tùy chọn cho phê duyệt, bắt buộc cho từ chối)
                </label>
                <Textarea
                  id="feedback-textarea"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập phản hồi của bạn..."
                  rows={3}
                  disabled={isLoading}
                />
                {feedbackError && (
                  <p className="text-red-500 text-sm mt-1">{feedbackError}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleApprove}
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Phê duyệt với phản hồi
                </Button>
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const ManagerApprovalRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Load requests từ API
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApprovalRequestService.getAllRequests();
      setRequests(data);
      setFilteredRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(req => req.decision === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(req => req.targetType === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.targetTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, typeFilter, searchTerm]);

  // Handle approve request
  const handleApprove = async (id: number, feedback?: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      await ApprovalRequestService.approveRequest(id, feedback);
      setSuccessMessage('Đã phê duyệt thành công!');
      
      // Reload data
      await loadRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Không thể phê duyệt yêu cầu. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject request
  const handleReject = async (id: number, feedback: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      await ApprovalRequestService.rejectRequest(id, feedback);
      setSuccessMessage('Đã từ chối yêu cầu!');
      
      // Reload data
      await loadRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Không thể từ chối yêu cầu. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRequests();
  }, []);

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.decision === 'PENDING').length,
    approved: requests.filter(r => r.decision === 'APPROVED').length,
    rejected: requests.filter(r => r.decision === 'REJECTED').length,
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Phê duyệt yêu cầu</h1>
          <Button onClick={loadRequests} variant="outline" disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Tổng cộng</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Chờ duyệt</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Đã duyệt</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Từ chối</div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search-input" className="block text-sm font-medium mb-2">Tìm kiếm:</label>
              <Input
                id="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, người tạo..."
              />
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium mb-2">Trạng thái:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium mb-2">Loại:</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="COURSE">Khóa học</option>
                <option value="CHAPTER">Chương</option>
                <option value="UNIT">Bài học</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                  setSearchTerm('');
                }}
                variant="outline"
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg">Không có yêu cầu nào</p>
                <p className="text-sm">
                  {requests.length === 0 
                    ? 'Chưa có yêu cầu phê duyệt nào được tạo.'
                    : 'Không tìm thấy yêu cầu phù hợp với bộ lọc.'
                  }
                </p>
              </div>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={actionLoading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerApprovalRequestsPage;
