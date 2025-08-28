import { useState, useEffect, useRef } from "react";
import aiApi, { findSession } from "../../api/aiApi";

interface PlannerChatBoxProps {
  userId: string;
}

interface Message {
  sender: "user" | "ai" | "ai-typing";
  text: string;
}

export function PlannerChatBox({ userId }: PlannerChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom within chatbot container only
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session history from API
  const loadSessionHistory = async (sessionId: number) => {
    try {
      console.log('📚 Loading planner session history for session:', sessionId);
      const response = await aiApi.get(`/sessions/${sessionId}`);
      const sessionData = response.data;
      
      console.log('✅ Planner session history loaded:', sessionData);
      
      // Convert session messages to our format
      if (sessionData.messages && sessionData.messages.length > 0) {
        const historyMessages: Message[] = [];
        sessionData.messages.forEach((msg: { 
          id: number; 
          order: number; 
          type: 'human' | 'ai'; 
          content: string; 
          created_at: string 
        }) => {
          if (msg.type === 'human') {
            historyMessages.push({ sender: "user", text: msg.content });
          } else if (msg.type === 'ai') {
            historyMessages.push({ sender: "ai", text: msg.content });
          }
        });
        
        console.log('💬 Setting planner history messages:', historyMessages);
        setMessages(historyMessages);
      }
      
      setHistoryLoaded(true);
    } catch (error) {
      console.error('❌ Error loading planner session history:', error);
      setHistoryLoaded(true); // Still mark as loaded to prevent infinite retry
    }
  };

  // Auto-load existing session on component mount
  useEffect(() => {
    const autoLoadSession = async () => {
      try {
        console.log('🔍 Auto-loading existing planner session...');
        const existingSession = await findSession({
          user_id: parseInt(userId),
          session_type: 'PLANNER',
        });
        
        console.log('✅ Auto-loaded existing planner session:', existingSession.id);
        setSessionId(existingSession.id);
        await loadSessionHistory(existingSession.id);
        
      } catch (error) {
        console.log('ℹ️ No existing planner session to auto-load:', error);
        setHistoryLoaded(true); // Mark as loaded so first message creates new session
      }
    };

    if (!historyLoaded && !sessionId) {
      autoLoadSession();
    }
  }, [userId, historyLoaded, sessionId]);

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
        // First, try to find existing session
        try {
          console.log('🔍 Looking for existing planner session...');
          const existingSession = await findSession({
            user_id: parseInt(userId),
            session_type: 'PLANNER',
          });
          
          console.log('✅ Found existing planner session:', existingSession.id);
          setSessionId(existingSession.id);
          
          // Load session history first if not already loaded
          if (!historyLoaded) {
            await loadSessionHistory(existingSession.id);
          }
          
          // Then send new message
          const res = await aiApi.post("/messages/", {
            session_id: existingSession.id,
            user_input: currentInput,
          });
          const data = res.data;
          setMessages((prev) => [
            ...prev, // Keep existing history
            { sender: "ai", text: data.ai_response } // Only add AI response, user message already added
          ]);
          
        } catch (findError) {
          console.log('🆕 No existing session found, creating new planner session...', findError);
          // If no existing session, create new one
          const res = await aiApi.post("/sessions/", {
            user_id: userId,
            session_type: "planner",
            first_message: currentInput,
            context: {}, // No specific context needed for planner
          });
          const data = res.data;
          setSessionId(data.session_id);
          setMessages((prev) => [
            ...prev.slice(0, -1), // Xoá typing indicator
            { sender: "ai", text: data.ai_first_response }
          ]);
        }
      } else {
        // Session already exists, just send message  
        console.log('📤 Sending message to existing planner session:', sessionId, currentInput);
        const res = await aiApi.post("/messages/", {
          session_id: sessionId,
          user_input: currentInput,
        });
        const data = res.data;
        setMessages((prev) => [
          ...prev.slice(0, -1), // Xoá typing indicator (user message đã có từ trước)
          { sender: "ai", text: data.ai_response }
        ]);
      }
    } catch (err: unknown) {
      console.error('PlannerChatBox error:', err);
      // Remove typing indicator and add error message
      setMessages((prev) => {
        const withoutTyping = prev.filter(msg => msg.sender !== "ai-typing");
        return [...withoutTyping, { sender: "ai", text: "Có lỗi khi gửi tin nhắn. Vui lòng thử lại." }];
      });
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
      <div className="px-4 py-2 border-b font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl flex items-center gap-2 text-sm">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#7c3aed"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">AI</text></svg>
        AI Lập lộ trình học tập
      </div>
      <div className="flex-1 px-4 py-3 overflow-y-auto max-h-80 space-y-2 bg-gray-50 text-sm min-h-[120px]" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-xs flex items-center justify-center h-full">
            Hỏi AI về lộ trình học tập, kế hoạch học, mục tiêu hoặc phương pháp học hiệu quả...
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.sender + idx + msg.text.slice(0,10)} className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.sender === "ai-typing" && (
              <div className="flex items-end gap-1 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-purple-300 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-purple-100 text-gray-400 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "ai" && (
              <div className="flex items-end gap-1">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
                <span className="inline-block bg-white border border-purple-100 text-gray-800 px-3 py-1 rounded-2xl shadow-sm max-w-xs text-left whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
            {msg.sender === "user" && (
              <div className="flex items-end gap-1 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-xs">Tôi</div>
                <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-2xl shadow-md max-w-xs text-right whitespace-pre-line text-xs">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t bg-white flex gap-2 items-center rounded-b-2xl">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Hỏi về lộ trình và kế hoạch học..."
          disabled={loading}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-purple-600 text-white px-4 py-1 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 text-sm"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >Gửi</button>
      </div>
    </div>
  );
}
