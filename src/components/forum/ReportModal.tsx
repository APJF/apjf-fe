import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string; // "Báo cáo bài viết" hoặc "Báo cáo bình luận"
  isSubmitting?: boolean;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title,
  isSubmitting = false 
}: ReportModalProps) {
  const [reason, setReason] = useState("");

  console.log('ReportModal render - isOpen:', isOpen, 'title:', title);

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason(""); // Clear form after submit
    }
  };

  const handleClose = () => {
    setReason(""); // Clear form on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">{title}</DialogTitle>
          <DialogDescription>
            Vui lòng mô tả lý do báo cáo. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do báo cáo *</Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do báo cáo (ví dụ: Nội dung không phù hợp, spam, ngôn từ thiếu văn hóa...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
