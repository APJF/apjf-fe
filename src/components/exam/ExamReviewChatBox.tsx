import { useState } from "react";
import aiApi from "../../api/aiApi";

interface ExamReviewChatBoxProps {
  userId: string;
  examResultId: number;
}

interface Message {
  sender: "user" | "ai" | "ai-typing";
  text: string;
}

export function ExamReviewChatBox({ userId, examResultId }: ExamReviewChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    
    // Debug logging
    console.log('🔍 ExamReviewChatBox - Environment check:');
    console.log('VITE_AI_URL:', import.meta.env.VITE_AI_URL);
    console.log('aiApi.defaults.baseURL:', aiApi.defaults.baseURL);
    
    // Hiển thị tin nhắn user ngay lập tức và icon typing cho AI
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      { sender: "ai-typing", text: "AI đang trả lời..." }
    ]);
    setInput("");
    try {
      if (!sessionId) {
        console.log('🚀 Creating new session with aiApi...');
        const res = await aiApi.post("/sessions", {
          user_id: userId,
          session_type: "reviewer",
          first_message: input,
          context: { exam_result_id: examResultId },
        });
        const data = res.data;
        setSessionId(data.session_id);
        setMessages((prev) => [
          ...prev.slice(0, -1), // Xoá typing indicator
          { sender: "ai", text: data.ai_first_response }
        ]);
      } else {
        console.log('💬 Sending message to existing session...');
        const res = await aiApi.post("/messages", {
          session_id: sessionId,
          user_input: input,
        });
        const data = res.data;
        setMessages((prev) => [
          ...prev.slice(0, -1), // Xoá typing indicator
          { sender: "ai", text: data.ai_response }
        ]);
      }
    } catch (err: unknown) {
      console.error('❌ ExamReviewChatBox error:', err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", text: "Có lỗi khi gửi tin nhắn." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-4 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-full min-h-[180px]">
      <div className="px-4 py-2 border-b font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl flex items-center gap-2 text-sm">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">AI</text></svg>
        Chat hỗ trợ chữa bài
      </div>
      <div className="flex-1 px-4 py-3 overflow-y-auto max-h-80 space-y-2 bg-gray-50 text-sm min-h-[120px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-xs flex items-center justify-center h-full">Hỏi AI về đáp án, lý do sai, hoặc cách giải thích...</div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.sender + idx + msg.text.slice(0,10)} className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.sender === "ai-typing" && (
              <div className="flex items-end gap-1 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-blue-100 text-gray-400 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "ai" && (
              <div className="flex items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-blue-100 text-gray-800 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "user" && (
              <div className="flex items-end gap-1 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-xs">Tôi</div>
                <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-2xl shadow-md max-w-xs text-right whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t bg-white flex gap-2 items-center rounded-b-2xl">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhập câu hỏi..."
          disabled={loading}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >Gửi</button>
      </div>
    </div>
  );
}
