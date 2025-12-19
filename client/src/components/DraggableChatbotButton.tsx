import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { useChatbotVisibility } from '@/contexts/ChatbotVisibilityContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

const DraggableChatbotButton: React.FC = () => {
  const { toggleChat } = useChatbotVisibility();
  const { user, loading } = useAuth(); // Destructure user and loading from useAuth
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false); // New ref to track if a drag occurred
  const dragOffset = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const STORAGE_KEY = 'chatbot_button_position';

  useEffect(() => {
    // Set default position to bottom-right to avoid overlap with sidebar
    const safeX = typeof window !== 'undefined' ? window.innerWidth - 100 : 50;
    const safeY = typeof window !== 'undefined' ? window.innerHeight - 100 : 50;
    setPosition({ x: safeX, y: safeY });
    
    // Attempt to load saved position
    const savedPosition = localStorage.getItem(STORAGE_KEY);
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        // ignore error
      }
    }
  }, []);

  const isMobile = useIsMobile();

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    // If mouse moves significantly, it's a drag
    if (Math.abs(clientX - (position.x + dragOffset.current.x)) > 5 ||
        Math.abs(clientY - (position.y + dragOffset.current.y)) > 5) {
      hasDragged.current = true;
    }

    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;

    // Constrain to viewport
    if (buttonRef.current) {
      const maxX = window.innerWidth - buttonRef.current.offsetWidth;
      const maxY = window.innerHeight - buttonRef.current.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }

    setPosition({ x: newX, y: newY });
  }, [isDragging, position]);

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (buttonRef.current) {
      setIsDragging(true);
      hasDragged.current = false; // Reset drag flag on interaction start
      dragOffset.current = {
        x: clientX - buttonRef.current.getBoundingClientRect().left,
        y: clientY - buttonRef.current.getBoundingClientRect().top,
      };
    }
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
    // Save position to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX, e.clientY);
    e.preventDefault(); // Prevent default drag behavior
  };

  const handleMouseMove = (e: MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleInteractionEnd();
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault(); // Prevent scrolling while dragging
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    // Check if a drag was initiated on the button
    if (isDragging) {
      handleInteractionEnd();
      // Manually trigger the click handler.
      // The `onClick` event won't fire on mobile because `e.preventDefault()` is called
      // in `handleTouchStart` to prevent scrolling during a drag.
      // We pass a null event because the event object is not used inside handleClick.
      handleClick(null as any);
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Only open chat if no significant drag occurred
    if (!hasDragged.current) {
      toggleChat();
    }
    hasDragged.current = false; // Reset for next interaction
  };

  useEffect(() => {
    const buttonElement = buttonRef.current;
    if (buttonElement) {
      if (isMobile) {
        buttonElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
      } else {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    }

    return () => {
      if (buttonElement) {
        if (isMobile) {
          buttonElement.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('touchend', handleTouchEnd);
        } else {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        }
      }
    };
  }, [isDragging, position, isMobile, updatePosition, handleTouchStart, handleTouchMove, handleTouchEnd]); // Re-run effect if dragging state, position, or mobile state changes

  // Always show button if user is logged in, forcing the UI to handle "no service" errors gracefully
  if (!user && !loading) {
    return null; 
  }

  return (
      <div className="fixed z-[100] rounded-full w-16 h-16 pointer-events-none" style={{ left: position.x, top: position.y }}>
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20 duration-1000"></div>
          {/* Main Button */}
          <Button
            ref={buttonRef}
            className="pointer-events-auto absolute inset-0 rounded-full w-16 h-16 shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(139,92,246,0.8)] transition-all duration-300 bg-gradient-to-br from-purple-600 to-indigo-600 border border-white/20 flex items-center justify-center overflow-hidden group hover:scale-110"
            style={{ cursor: isDragging ? 'grabbing' : (isMobile ? 'grab' : 'grab') }}
            onMouseDown={isMobile ? undefined : handleMouseDown}
            onClick={handleClick}
            size="lg"
          >
            <MessageSquare className="h-8 w-8 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-in zoom-in spin-in duration-500" />
          </Button>
      </div>
  );
};

export default DraggableChatbotButton;