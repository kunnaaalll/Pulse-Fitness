import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { useChatbotVisibility } from '@/contexts/ChatbotVisibilityContext';
import { useAuth } from '@/hooks/useAuth';

const DraggableChatbotButton: React.FC = () => {
  const { toggleChat, isChatOpen } = useChatbotVisibility();
  const { user, loading } = useAuth(); // Destructure user and loading from useAuth

  // Always show button if user is logged in, but hide it if the chat window is already open
  if ((!user && !loading) || isChatOpen) {
    return null; 
  }

  return (
      <div className="fixed bottom-6 right-6 z-[100] rounded-full w-16 h-16">
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20 duration-1000"></div>
          {/* Main Button */}
          <Button
            className="absolute inset-0 rounded-full w-16 h-16 shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.8)] transition-all duration-300 bg-gradient-to-br from-purple-600 to-indigo-600 border border-white/20 flex items-center justify-center overflow-hidden group hover:scale-110"
            onClick={toggleChat}
            size="lg"
          >
            <MessageSquare className="h-8 w-8 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-in zoom-in spin-in duration-500" />
          </Button>
      </div>
  );
};

export default DraggableChatbotButton;