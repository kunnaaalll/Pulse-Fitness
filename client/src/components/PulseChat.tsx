
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from '@/hooks/useAuth';
import PulseChatInterface from './PulseChatInterface';
import { useChatbotVisibility } from '@/contexts/ChatbotVisibilityContext';
import { getAIServices } from '@/services/aiServiceSettingsService';

const PulseChat = () => {
  const { user, loading } = useAuth(); // Get loading state from useAuth
  const { isChatOpen, closeChat } = useChatbotVisibility();
  const [hasEnabledServices, setHasEnabledServices] = useState(false); // Keep this state

  const checkEnabledServices = useCallback(async () => {
    if (loading) { // Do not proceed if authentication is still loading
      setHasEnabledServices(false);
      return;
    }
    try {
      const services = await getAIServices();
      const enabled = services.some(service => service.is_active);
      setHasEnabledServices(enabled);
    } catch (error) {
      console.error('Error fetching AI services:', error);
      setHasEnabledServices(false);
    }
  }, [loading]); // Add loading to dependency array

  // Create a safe default empty object if user is undefined to prevent crashes
  // during logout/loading transitions
  const safeUser = user || { id: '' };

  useEffect(() => {
    checkEnabledServices();
  }, [checkEnabledServices]);

  // If loading, don't render anything yet, but don't return null if we want to default to visible
  if (loading) {
    return null; 
  }

  // Always render the Sheet if we're not loading. 
  // We let PulseChatInterface handle the "No Enabled Services" state gracefully 
  // by showing a setup message instead of hiding the entire chat window.
  // This lines up with our fix for the button visibility.
  const shouldRender = true; 

  if (!shouldRender) {
    return null;
  }

  return (
    <Sheet open={isChatOpen} onOpenChange={closeChat}>
      <SheetContent side="right" className="w-full sm:w-[35vw] sm:min-w-[400px] sm:max-w-none p-0 border-l border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(139,92,246,0.15)]">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                    Pulse AI
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-400 font-medium">
                    Your personal nutrition & fitness companion
                  </SheetDescription>
                </div>
              </div>
              
              {/* Clear History Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const event = new CustomEvent('clearChatHistory');
                  window.dispatchEvent(event);
                }}
                aria-label="Clear chat history"
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full h-8 w-8 transition-colors"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
            <PulseChatInterface />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PulseChat;
