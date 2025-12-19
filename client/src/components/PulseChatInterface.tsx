import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ImageIcon, X } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';
import PulseNutritionCoach from './PulseNutritionCoach';
import { usePreferences } from '@/contexts/PreferencesContext'; // Import usePreferences
import { debug, info, warn, error } from '@/utils/logging'; // Import logging utilities
import {
  loadUserPreferences,
  loadChatHistory,
  saveMessageToHistory,
  clearChatHistory,
  processUserInput,
  getTodaysNutrition,
  Message,
  UserPreferences,
} from '@/services/pulseChatService';
import { getActiveAiServiceSetting, AIService } from '@/services/aiServiceSettingsService';


const PulseChatInterface = () => {
  const { formatDateInUserTimezone } = usePreferences(); // Get timezone and formatter from context
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null); // State to store user preferences
  const [activeAIServiceSetting, setActiveAIServiceSetting] = useState<AIService | null>(null); // State to store active AI service setting
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // State to store the selected image file
  const coachRef = useRef<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load user preferences and chat history when userId is ready
  useEffect(() => {
    
    loadUserPreferencesAndHistory();
    loadActiveAIServiceSetting(); // Load active AI service setting
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize chat when coach, userId, and preferences are ready
  // Initialize chat when coach, userId, and preferences are ready (runs once on mount)
  useEffect(() => {
    const checkAndInitialize = () => {
      if (userPreferences && coachRef.current && !isInitialized) {
        initializeChat();
      } else if (!isInitialized) {
        // If not initialized but dependencies aren't ready, check again
        setTimeout(checkAndInitialize, 100);
      }
    };

    checkAndInitialize();

    // Cleanup function (optional, but good practice)
    return () => {
      // Any cleanup needed when the component unmounts
    };
  }, [userPreferences, isInitialized]); // Dependencies for the effect (userId and preferences might load async)


  // Effect to listen for clear chat history event
  useEffect(() => {
    const handleClearChatHistory = async () => {
      if (coachRef.current) {
        setIsLoading(true);
        try {
          await clearChatHistory('all'); // Call clear history function
          setMessages([]); // Clear local state
          toast({
            title: "Chat Cleared",
            description: "Your chat history has been cleared.",
          });
        } catch (error) {
          console.error('PulseChatInterface: Error clearing chat history:', error);
           toast({
            title: "Error",
            description: "Failed to clear chat history.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('clearChatHistory', handleClearChatHistory);

    return () => {
      window.removeEventListener('clearChatHistory', handleClearChatHistory);
    };
  }, [coachRef.current]); // Dependencies for the effect

  const loadUserPreferencesAndHistory = async () => {
    // Load user preferences
    const preferencesData = await loadUserPreferences();
    setUserPreferences(preferencesData);

    const autoClearHistory = preferencesData?.auto_clear_history || 'never';

    if (autoClearHistory === 'all') {
      await clearChatHistory('all');
    }

    const historyData = await loadChatHistory(autoClearHistory);
    setMessages(historyData);
    
    // Mark as initialized after loading history and preferences
    setIsInitialized(true);
  };

  const loadActiveAIServiceSetting = async () => {
    try {
      const setting = await getActiveAiServiceSetting();
      setActiveAIServiceSetting(setting);
    } catch (err) {
      console.error('Error loading active AI service setting:', err);
      toast({
        title: "Error",
        description: "Failed to load active AI service setting. Please configure it in settings.",
        variant: "destructive",
      });
    }
  };


  const initializeChat = async () => {
    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nutritionData = await getTodaysNutrition(today);
      
      if (messages.length === 0) {
        if (nutritionData && nutritionData.analysis) {
          const welcomeMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: `👋 **Hi there! I'm Pulse, your AI nutrition coach!**\n\n${nutritionData.analysis}\n\n💡 **Tips for today:**\n${nutritionData.tips}\n\n🗣️ Ask me about nutrition, exercise, or healthy lifestyle tips! I can help you:\n• Understand your nutrition data\n• Suggest meal improvements\n• Provide exercise recommendations\n• Give wellness advice\n• Track food and workouts`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, welcomeMessage]);
        } else {
          const defaultMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: '👋 **Hi! I\'m Pulse, your AI nutrition coach!**\n\n🍎 I can help you with nutrition advice and healthy living tips\n🏃‍♂️ Ask me about exercise recommendations\n📊 Get insights about your eating habits\n💡 Receive personalized wellness guidance\n\n💬 Try asking: "What should I eat for a healthy breakfast?" or "How can I increase my protein intake?"',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, defaultMessage]);
        }
      } else {
        // If messages were loaded from history, do not add a welcome message.
      }
    } catch (error) {
      console.error('PulseChatInterface: Error initializing chat:', error);
      // Only add error message if no messages exist after loading history
      if (messages.length === 0) { // Check if messages state is empty after loading history
        const errorMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: '👋 **Hi! I\'m Pulse, your nutrition coach!**\n\n🥗 Ask me about nutrition and healthy eating\n💪 Get exercise and wellness tips\n📈 Learn about balanced nutrition\n\nI\'m here to help you achieve your health goals!',
          isUser: false,
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!activeAIServiceSetting) {
      toast({
        title: "Error",
        description: "No active AI service configured. Please go to settings to set one up.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user-${Math.random().toString(36).substring(2, 9)}`,
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessageToHistory(userMessage.content, 'user');
    
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    // Generate a unique transaction ID for this message processing
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Starting message processing for:`, currentInput);

    // Get user's current date to pass to AI
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const userDate = `${year}-${month}-${day}`;

    try {
      let response;
      
      // If an image is selected, send both text and image
      if (selectedImage) {
        // Create a temporary user message to show the image preview in the chat
        const userMessageWithImage: Message = {
          id: `msg-${Date.now()}-user-image-${Math.random().toString(36).substring(2, 9)}`,
          content: inputValue.trim() || 'Image uploaded', // Use input value or a default message
          isUser: true,
          timestamp: new Date(),
          metadata: { imageUrl: URL.createObjectURL(selectedImage) } // Store image URL for preview
        };
        setMessages(prev => [...prev, userMessageWithImage]);
        
        response = await processUserInput(
          inputValue.trim(),
          selectedImage,
          transactionId,
          null, // lastBotMessageMetadata is not used for initial input
          userPreferences?.logging_level || 'INFO',
          formatDateInUserTimezone,
          activeAIServiceSetting, // Pass the active AI service setting object
          messages, // Pass the messages array
          userDate // Pass user's date
        );
        setSelectedImage(null); // Clear the selected image after sending
        
      } else {
        // Check if it's a numbered response (for food options)
        const numberMatch = currentInput.match(/^(\d+)$/);
        
        if (numberMatch) {
          info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Numbered input detected:`, numberMatch[1]);
          // Handle numbered responses for food options
          const lastBotMessage = messages.slice().reverse().find(msg => !msg.isUser && msg.metadata);
          info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Last bot message with metadata:`, lastBotMessage);
          
          if (lastBotMessage?.metadata?.foodOptions) {
            const optionIndex = parseInt(numberMatch[1]) - 1;
            info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Processing food option selection:`, optionIndex, lastBotMessage.metadata);
            response = await processUserInput(
              currentInput,
              null,
              transactionId,
              lastBotMessage.metadata,
              userPreferences?.logging_level || 'INFO',
              formatDateInUserTimezone,
              activeAIServiceSetting, // Pass the ID of the active AI service setting
              messages, // Pass the messages array
              userDate // Pass user's date
            );
          } else {
            info(userPreferences?.logging_level || 'INFO', `[${transactionId}] No food options metadata found on last bot message, processing as new input.`);
            response = await processUserInput(
              currentInput,
              null,
              transactionId,
              null, // No lastBotMessageMetadata
              userPreferences?.logging_level || 'INFO',
              formatDateInUserTimezone,
              activeAIServiceSetting, // Pass the active AI service setting object
              messages, // Pass the messages array
              userDate // Pass user's date
            );
          }
        } else {
          info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Processing input as new request:`, currentInput);
          response = await processUserInput(
            currentInput,
            null,
            transactionId,
            null, // No lastBotMessageMetadata
            userPreferences?.logging_level || 'INFO',
            formatDateInUserTimezone,
            activeAIServiceSetting, // Pass the active AI service setting object
            messages, // Pass the messages array
            userDate // Pass user's date
          );
        }
      }
      
      info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Received response from coach:`, response);
      
      // Handle different response scenarios based on action type
      let botMessageContent = '';
      let messageMetadata = response?.metadata; // Preserve metadata
      
      if (response) {
        switch (response.action) {
          case 'food_added':
          case 'exercise_added':
          case 'log_water':
          case 'water_added':
            botMessageContent = response.response || 'Entry logged successfully!';
            window.dispatchEvent(new Event('foodDiaryRefresh'));
            break;
          case 'measurement_added':
            botMessageContent = response.response || 'Entry logged successfully!';
            window.dispatchEvent(new Event('measurementsRefresh'));

            // Trigger data refresh for nutrition analysis after a short delay
            setTimeout(async () => {
              try {
                info(userPreferences?.logging_level || 'INFO', `[${transactionId}] Triggering data refresh after logging.`);
                const today = new Date().toISOString().split('T')[0];
                const nutritionData = await getTodaysNutrition(today);
                if (nutritionData && nutritionData.analysis) {
                  const updateMessage: Message = {
                    id: `msg-${Date.now()}-update-${Math.random().toString(36).substring(2, 9)}`,
                    content: `📊 **Updated Progress:**\n${nutritionData.analysis}\n\n💡 **Coaching tip:** ${nutritionData.tips}`,
                    isUser: false,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, updateMessage]);
                }
              } catch (error) {
                console.error('PulseChatInterface: Error refreshing data after logging:', error);
              }
            }, 1000);
            break;
          case 'food_options':
          case 'exercise_options':
            // For options, display the options and store metadata for the next user response
            botMessageContent = response.response;
            messageMetadata = response.metadata; // Ensure metadata with options is saved
            break;
          case 'advice':
          case 'chat':
            // For conversational responses, display the AI's reply
            botMessageContent = response.response;
            break;
          case 'none':
            // For 'none' action, display the provided response (e.g., error or clarification)
            botMessageContent = response.response || 'I\'m not sure how to handle that request.';
            break;
          default:
            // Fallback for unexpected actions
            warn(userPreferences?.logging_level || 'INFO', `[${transactionId}] Unexpected response action:`, response.action);
            botMessageContent = response.response || 'An unexpected response was received.';
            break;
        }
      } else {
        // Handle case where response is null or undefined
        warn(userPreferences?.logging_level || 'INFO', `[${transactionId}] Received null or undefined response from coach`);
        botMessageContent = 'Sorry, I did not receive a valid response.';
      }
      
      
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot-${Math.random().toString(36).substring(2, 9)}`,
        content: botMessageContent,
        isUser: false,
        timestamp: new Date(),
        metadata: messageMetadata // Use the potentially updated metadata
      };
      
      // Always add the bot message after processing, regardless of whether an image was sent
      setMessages(prev => [...prev, botMessage]);
      await saveMessageToHistory(botMessage.content, 'assistant', botMessage.metadata);
      
      
    } catch (err) {
      error(userPreferences?.logging_level || 'INFO', `[${transactionId}] Error processing message:`, err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error-${Math.random().toString(36).substring(2, 9)}`,
        content: 'Sorry, I encountered an error. Please check that you have AI services configured in Settings. In the meantime, I can still provide general nutrition and wellness advice! 🌟',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please check your AI service settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Optionally, clear the input value if an image is selected
      // setInputValue('');
    } else {
      setSelectedImage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Modify formatMessage to handle image previews
  const formatMessage = (message: Message) => {
    let content = message.content;
    // Simple markdown-like formatting
    content = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

    // Add image preview if metadata contains imageUrl
    if (message.metadata?.imageUrl) {
      content = `<img src="${message.metadata.imageUrl}" alt="Uploaded image preview" class="max-w-full h-auto rounded-md mb-2" /><br />${content}`;
    }

    return DOMPurify.sanitize(content);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
       {/* Background glow effect - Subtle */}
      
      <PulseNutritionCoach
        ref={coachRef}
        userLoggingLevel={userPreferences?.logging_level || 'ERROR'}
        formatDateInUserTimezone={formatDateInUserTimezone}
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth pb-4" ref={scrollAreaRef} style={{ scrollBehavior: 'smooth' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md transition-all duration-300 ${
                  message.isUser
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-slate-100 rounded-tl-none border border-white/10'
                }`}
              >
                <div
                  className="prose prose-invert prose-sm max-w-none leading-relaxed break-words"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message)
                  }}
                />
                <div className={`text-[10px] mt-2 font-medium opacity-70 inline-block`}>
                  {message.timestamp && !isNaN(message.timestamp.getTime()) ? formatDateInUserTimezone(message.timestamp, 'p') : ''}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse" key="pulse-chat-loading-spinner">
              <div className="bg-zinc-800 border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Coach is thinking...</span>
              </div>
            </div>
          )}
           <div ref={coachRef} /> {/* Dummy element for scrolling to bottom */}
      </div>
      
      {/* Sticky Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/80 backdrop-blur-xl relative z-20 shrink-0 mb-safe">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-4 relative w-24 h-24 group animate-in zoom-in-95">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected food image preview"
              className="relative w-full h-full object-cover rounded-md border border-white/20"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Pulse Coach..."
              disabled={isLoading || !coachRef.current}
              className="bg-zinc-900/80 border-white/10 text-white placeholder:text-gray-500 focus:ring-purple-500 focus:border-purple-500 rounded-xl pl-4 pr-10 py-6 text-base"
            />
          </div>
          
          <input
            type="file"
            accept="image/*"
            id="image-upload"
            className="hidden"
            onChange={handleImageSelect}
          />
          <label htmlFor="image-upload" className="shrink-0">
            <Button
              asChild
              variant="outline"
              size="icon"
              disabled={isLoading || !coachRef.current}
              className="h-12 w-12 rounded-xl bg-zinc-900/50 border-white/10 hover:bg-white/10 hover:border-purple-500 text-purple-300 transition-all"
            >
              <div className="cursor-pointer flex items-center justify-center w-full h-full">
                <ImageIcon className="h-5 w-5" />
              </div>
            </Button>
          </label>
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputValue.trim() && !selectedImage) || !coachRef.current}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {!coachRef.current && (
          <div className="text-[10px] text-white/40 mt-2 text-center">
            Connecting to AI...
          </div>
        )}
      </div>
    </div>
  );
};

export default PulseChatInterface;
