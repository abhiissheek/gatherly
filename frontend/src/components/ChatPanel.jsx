import { useEffect, useState, useRef } from "react";
import { Send, X } from "lucide-react";
import { useMeetingStore } from "../store/useMeetingStore";
import useAuthUser from "../hooks/useAuthUser";
import { getChatHistory } from "../lib/meetingApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const ChatPanel = ({ meetingId, socket, onClose }) => {
  const { authUser } = useAuthUser();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);
  
  const { messages, setMessages, resetUnreadMessages, addMessage } = useMeetingStore();

  useEffect(() => {
    // Load chat history
    const loadHistory = async () => {
      try {
        const data = await getChatHistory(meetingId);
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    loadHistory();
    
    // Reset unread messages when chat is opened
    resetUnreadMessages();
  }, [meetingId, resetUnreadMessages, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    // Optimistically add message to UI immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      meetingId,
      sender: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
      content: messageInput.trim(),
      type: "text",
      createdAt: new Date().toISOString(),
    };
    
    addMessage(optimisticMessage);

    socket.emit("chat-message", {
      meetingId,
      userId: authUser._id,
      content: messageInput.trim(),
    });

    setMessageInput("");
  };

  return (
    <div className="w-80 border-l border-teal-700/30 bg-slate-800/80 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-teal-700/30 flex items-center justify-between">
        <h2 className="font-semibold text-white">Chat</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">No messages yet</p>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender._id === authUser._id;
            
            return (
              <div
                key={index}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                {/* Sender name and time */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isOwn && (
                    <span className="text-xs font-medium text-slate-300">
                      {message.sender.fullName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                {/* Message bubble */}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    isOwn
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-slate-700 text-white rounded-bl-none border border-slate-600'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-teal-700/30 space-y-2">
        <Input
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="bg-slate-700 border-teal-700/30 text-white placeholder:text-slate-500"
        />
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
