import React, { useState, useEffect } from "react";
import { MessageSquare, X, ChevronLeft, Users, MessageCircle } from "lucide-react";
import { useChat } from "./ChatProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatWindow } from "./ChatWindow";
import { DMList } from "./DMList";
import { motion, AnimatePresence } from "framer-motion";

export const ChatWidget = () => {
  const { 
    user, isOpen, setIsOpen, onlineCount, onlineUsers, view, setView, activeChat, setActiveChat,
    lightboxImage, setLightboxImage 
  } = useChat();
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBack = () => {
    if (activeChat?.type === "dm" || view === "dms") {
       setActiveChat({ id: "global", type: "group", participants: [] });
       setView("group");
    } else if (!isLargeScreen) {
       setIsOpen(false);
    }
  };

  return (
    <>
      <div className={cn(
        "z-60 flex flex-col items-end pointer-events-none transition-all duration-300",
        isLargeScreen ? "fixed inset-y-0 right-0 w-[450px]" : "fixed bottom-0 right-0 left-0"
      )}>
        {isOpen && (
          <div 
            className={cn(
              "pointer-events-auto h-full w-full bg-black shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-10 duration-300 relative border-l border-[#2f3336]",
              !isLargeScreen && "fixed inset-0 z-70"
            )}
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-[#2f3336] bg-black/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {(activeChat?.type === "dm" || !isLargeScreen) && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 hover:bg-[#181818]" onClick={handleBack}>
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                <div>
                  <h3 className="font-bold text-lg text-[#e7e9ea] leading-none flex items-center gap-2">
                    {activeChat?.type === "dm" ? activeChat.otherUserNickname : "Global Chat"}
                    {activeChat?.type === "dm" && onlineUsers[activeChat.participants.find(p => p !== user?.uid)!] && (
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" title="Online" />
                    )}
                  </h3>
                  <p className="text-xs text-[#71767b] mt-1">
                    {activeChat?.type === "group" 
                      ? `${onlineCount} users online` 
                      : (onlineUsers[activeChat?.participants.find(p => p !== user?.uid)!] ? "Online" : "Offline")}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-[#71767b] hover:bg-[#181818] hover:text-[#e7e9ea]" onClick={() => setIsOpen(false)}>
                <X className="h-7 w-7" />
              </Button>
            </div>

            {/* Navigation Tabs (Only in root view) */}
            {(!activeChat || activeChat.id === "global") && (
              <div className="flex border-b border-[#2f3336] bg-black">
                <button 
                  onClick={() => setView("group")}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2",
                    view === "group" ? "text-[#1d9bf0] border-[#1d9bf0]" : "text-[#71767b] border-transparent hover:bg-[#16181c]"
                  )}
                >
                  <Users className="h-4 w-4" /> GROUP
                </button>
                <button 
                  onClick={() => setView("dms")}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2",
                    view === "dms" ? "text-[#1d9bf0] border-[#1d9bf0]" : "text-[#71767b] border-transparent hover:bg-[#16181c]"
                  )}
                >
                  <MessageCircle className="h-4 w-4" /> DMS
                </button>
              </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-black">
              {(activeChat?.type === "dm" || view === "group") ? (
                <ChatWindow />
              ) : (
                <DMList />
              )}
            </div>
          </div>
        )}
        
        {/* Launch Button (Only when closed or on smaller screens) */}
        {(!isLargeScreen || !isOpen) && (
          <Button
            onClick={() => setIsOpen(!isOpen)}
            size="icon"
            className={cn(
              "pointer-events-auto h-14 w-14 rounded-full shadow-2xl transition-all duration-300 mb-6 mr-6",
              isOpen ? "bg-[#2f3336] hover:bg-[#3e4144]" : "bg-[#1d9bf0] hover:bg-[#1a8cd8]",
              !isLargeScreen && isOpen && "hidden",
              isLargeScreen && "fixed bottom-4 right-4"
            )}
          >
            {isOpen ? <X className="h-7 w-7 text-white" /> : <MessageSquare className="h-7 w-7 text-white" />}
          </Button>
        )}
      </div>

      {/* Chat Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/95 flex flex-col backdrop-blur-md"
          >
            <div className="flex justify-end p-4 absolute top-0 left-0 right-0 z-10">
              <button
                onClick={() => setLightboxImage(null)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-[#e7e9ea] hover:bg-[#2f3336] transition-colors"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div
              className="flex-1 flex items-center justify-center p-4"
              onClick={() => setLightboxImage(null)}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={lightboxImage}
                alt=""
                className="max-w-full max-h-full object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
