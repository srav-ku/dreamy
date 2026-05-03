import React from "react";
import { useChat } from "./ChatProvider";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock } from "lucide-react";

export const DMList = () => {
  const { dms, setActiveChat } = useChat();

  return (
    <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto bg-black">
      {dms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
          <div className="w-20 h-20 rounded-full bg-[#16181c] flex items-center justify-center mb-6">
            <MessageCircle className="h-10 w-10 text-[#71767b]" />
          </div>
          <p className="text-lg font-bold text-[#e7e9ea]">No messages yet</p>
          <p className="text-sm mt-2 max-w-[200px]">Click an actress's name in the group chat to start a private conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="px-2 pb-2 text-[11px] font-bold text-[#71767b] uppercase tracking-widest">
            DIRECT MESSAGES
          </h4>
          {dms.map((dm) => (
            <button
              key={dm.id}
              onClick={() => setActiveChat(dm)}
              className="w-full p-4 rounded-2xl border border-[#2f3336] bg-[#16181c]/50 hover:bg-[#1d9bf0]/5 hover:border-[#1d9bf0]/30 transition-all text-left group flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#2f3336] flex items-center justify-center text-[#1d9bf0] font-bold text-lg border border-white/5 group-hover:scale-105 transition-transform">
                {dm.otherUserNickname?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[15px] text-[#e7e9ea] group-hover:text-[#1d9bf0] truncate">
                    {dm.otherUserNickname}
                  </span>
                  {dm.updatedAt && (
                    <span className="text-[10px] text-[#71767b] flex items-center gap-1">
                       <Clock className="h-3 w-3" />
                       {new Date(dm.updatedAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#71767b] truncate leading-tight">
                  {dm.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
