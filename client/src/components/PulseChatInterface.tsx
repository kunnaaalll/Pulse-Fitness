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

  const { formatDateInUserTimezone, energyUnit, convertEnergy, getEnergyUnitString } = usePreferences(); // Get timezone and formatter from context

  // ... (rest of the component state)

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
       {/* Background glow effect - Subtle */}
      
      <PulseNutritionCoach
        ref={coachRef}
        userLoggingLevel={userPreferences?.logging_level || 'ERROR'}
        formatDateInUserTimezone={formatDateInUserTimezone}
        energyUnit={energyUnit}
        convertEnergy={convertEnergy}
        getEnergyUnitString={getEnergyUnitString}
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
      <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-xl relative z-20 shrink-0 mb-safe">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-4 relative w-20 h-20 group animate-in zoom-in-95 ml-2">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected food image preview"
              className="relative w-full h-full object-cover rounded-xl border border-white/20"
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
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative group">
             {/* Attachment Button Inside Input */}
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              className="hidden"
              onChange={handleImageSelect}
            />
            <label 
              htmlFor="image-upload" 
              className="absolute left-3 bottom-0.5 transform -translate-y-1/2 z-10 cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ bottom: '26px' }} // Manually centering vertically relative to input height
            >
                <div className="text-slate-400 hover:text-purple-400 transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </div>
            </label>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Pulse Coach..."
              disabled={isLoading || !coachRef.current}
              className="bg-zinc-900/50 border-white/10 hover:border-white/20 focus:border-purple-500/50 text-white placeholder:text-slate-500 rounded-2xl pl-12 pr-4 py-6 text-base shadow-inner transition-all w-full"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputValue.trim() && !selectedImage) || !coachRef.current}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
          </Button>
        </div>
        {!coachRef.current && (
          <div className="text-[10px] text-zinc-500 mt-2 text-center animate-pulse">
            Connecting to AI Service...
          </div>
        )}
      </div>
    </div>
  );
};

export default PulseChatInterface;
