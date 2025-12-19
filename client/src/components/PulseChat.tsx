
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
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Pulse AI Coach
              </SheetTitle>
              <SheetDescription>
                Your personal AI nutrition and fitness coach.
              </SheetDescription>
              {/* Add Clear History Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // This will be handled by the PulseChatInterface component
                  // We just need to trigger the action
                  const event = new CustomEvent('clearChatHistory');
                  window.dispatchEvent(event);
                }}
                aria-label="Clear chat history"
                className="ml-auto" // Push button to the right
              >
                {/* Using Trash2 icon for clear */}
                <Trash2 className="h-5 w-5" />
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
