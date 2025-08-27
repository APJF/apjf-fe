import { useState } from "react";
import aiApi from "../../api/aiApi";

interface LearningChatBoxProps {
  userId: string;
  materialId: string;
}

interface Message {
  sender: "user" | "ai" | "ai-typing";
  text: string;
}

export function LearningChatBox({ userId, materialId }: LearningChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    
    // Hiển thị tin nhắn user ngay lập tức và icon typing cho AI
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      { sender: "ai-typing", text: "AI đang trả lời..." }
    ]);
    
    const currentInput = input;
    setInput(""); // Clear input immediately
    
    try {
      if (!sessionId) {
        const res = await aiApi.post("/sessions/", {
          user_id: userId,
          session_type: "learning",
          first_message: currentInput,
          context: { material_id: materialId },
        });
        const data = res.data;
        setSessionId(data.session_id);
        setMessages((prev) => [
          ...prev.slice(0, -1), // Xoá typing indicator
          { sender: "ai", text: data.ai_first_response }
        ]);
      } else {
        const res = await aiApi.post("/messages/", {
          session_id: sessionId,
          user_input: currentInput,
        });
        const data = res.data;
        setMessages((prev) => [
          ...prev.slice(0, -1), // Xoá typing indicator
          { sender: "ai", text: data.ai_response }
        ]);
      }
    } catch (err: unknown) {
      console.error('LearningChatBox error:', err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", text: "Có lỗi khi gửi tin nhắn." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-4 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-full min-h-[180px]">
      <div className="px-4 py-2 border-b font-semibold text-green-700 bg-gradient-to-r from-green-50 to-white rounded-t-2xl flex items-center gap-2 text-sm">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#059669"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">AI</text></svg>
        AI Hướng dẫn học tập
      </div>
      <div className="flex-1 px-4 py-3 overflow-y-auto max-h-80 space-y-2 bg-gray-50 text-sm min-h-[120px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-xs flex items-center justify-center h-full">
            Hỏi AI về tài liệu học tập, từ vựng, ngữ pháp hoặc cách học hiệu quả...
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.sender + idx + msg.text.slice(0,10)} className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.sender === "ai-typing" && (
              <div className="flex items-end gap-1 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-green-300 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-green-100 text-gray-400 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "ai" && (
              <div className="flex items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-green-100 text-gray-800 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "user" && (
              <div className="flex items-end gap-1 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-xs">Tôi</div>
                <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-2xl shadow-md max-w-xs text-right whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t bg-white flex gap-2 items-center rounded-b-2xl">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 transition text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Hỏi về tài liệu học tập..."
          disabled={loading}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-green-600 text-white px-4 py-1 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 text-sm"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >Gửi</button>
      </div>
    </div>
  );
}
