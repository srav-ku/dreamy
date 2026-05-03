import React, { useEffect, useState, useRef } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useChat } from "./ChatProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { MessageCircle, Check, CheckCheck, Reply } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  userId: string;
  nickname: string;
  createdAt: any;
  imageRef?: {
    imageId: number;
    imageUrl: string;
    albumSlug: string;
    personSlug: string;
    personName?: string;
    albumName?: string;
  };
  replyTo?: {
    id: string;
    text: string;
    nickname: string;
  };
  status?: "sent" | "read";
}

export const MessageList = () => {
  const { user, activeChat, startDM, setLightboxImage, setReplyTo } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChat) return;

    let q;
    if (activeChat.id === "global") {
      q = query(
        collection(db, "global_chat", "data", "messages"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    } else {
      q = query(
        collection(db, "chats", activeChat.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      setMessages(msgs.reverse());

      // Mark messages as read
      if (activeChat.id !== "global" && user) {
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.userId !== user.uid && data.status !== "read") {
            updateDoc(d.ref, { status: "read" }).catch(() => {});
          }
        });
      }
    });

    let unsubscribeChat: any = null;
    if (activeChat.id !== "global") {
      unsubscribeChat = onSnapshot(doc(db, "chats", activeChat.id), (docSnap) => {
        if (docSnap.exists() && docSnap.data().typing) {
          setTypingStatus(docSnap.data().typing);
        } else {
          setTypingStatus({});
        }
      });
    }

    return () => {
      unsubscribe();
      if (unsubscribeChat) unsubscribeChat();
    };
  }, [activeChat, user]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      requestAnimationFrame(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: messages.length <= 1 ? "auto" : "smooth" 
        });
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
      <div className="flex flex-col gap-6 py-4">
        {messages.map((msg, index) => {
          const isMe = msg.userId === user?.uid;
          const prevMsg = messages[index - 1];
          const isSameUser = prevMsg?.userId === msg.userId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
            >
              {!isSameUser && (
                <div className={`flex items-center gap-2 mb-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <button 
                    onClick={() => {
                      if (!isMe) {
                        console.log(`[DM] Triggering startDM for ${msg.nickname} (${msg.userId})`);
                        startDM(msg.userId, msg.nickname);
                      }
                    }}
                    className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-tight transition-colors ${
                      isMe ? "text-[#1d9bf0]" : "text-[#71767b] hover:text-[#1d9bf0] cursor-pointer"
                    }`}
                    disabled={isMe}
                  >
                    {msg.nickname}
                    {!isMe && activeChat?.id === "global" && (
                      <MessageCircle className="h-3 w-3 text-[#1d9bf0]" />
                    )}
                  </button>
                  <span className="text-[10px] text-[#536471]">
                    {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              )}
              
              <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm relative ${
                    isMe
                      ? "bg-[#1d9bf0] text-white rounded-tr-none"
                      : "bg-[#16181c] text-[#e7e9ea] border border-[#2f3336] rounded-tl-none"
                  }`}
                >
                  {msg.replyTo && (
                    <div 
                      className={`mb-2 pl-3 border-l-4 py-1 text-xs opacity-90 rounded-r-md ${isMe ? "border-white/50 bg-black/10" : "border-[#1d9bf0] bg-black/30"}`}
                    >
                      <p className="font-bold mb-0.5">{msg.replyTo.nickname}</p>
                      <p className="truncate opacity-80">{msg.replyTo.text || "Image"}</p>
                    </div>
                  )}
                {msg.imageRef && (
                  <div 
                    onClick={() => setLightboxImage(msg.imageRef!.imageUrl)}
                    className="block mb-3 overflow-hidden rounded-xl border border-white/10 hover:opacity-90 transition-opacity bg-black cursor-pointer group"
                  >
                    <img 
                      src={msg.imageRef.imageUrl} 
                      alt="Mentioned image" 
                      className="w-full h-auto object-cover max-h-60 transition-transform group-hover:scale-105"
                    />
                    <div className="p-3 bg-[#181818] border-t border-white/5">
                      <p className="font-bold text-xs truncate text-[#e7e9ea]">{msg.imageRef.personName}</p>
                      <p className="text-[10px] text-[#71767b] truncate mt-0.5 uppercase tracking-wide">{msg.imageRef.albumName}</p>
                    </div>
                  </div>
                )}
                <p className="whitespace-pre-wrap wrap-break-word inline-block">{msg.text}</p>
                {isMe && msg.createdAt && (
                  <span className="inline-flex items-center ml-2 -mb-1 relative top-0.5">
                    {msg.status === "read" ? (
                      <CheckCheck className="h-4 w-4 text-white drop-shadow-sm" />
                    ) : (
                      <Check className="h-4 w-4 text-white/60" />
                    )}
                  </span>
                )}
                </div>
                <button 
                  onClick={() => setReplyTo(msg)}
                  className={`opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-[#16181c] transition-all text-[#71767b] ${isMe ? "mr-1" : "ml-1"}`}
                >
                  <Reply className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {Object.entries(typingStatus).filter(([id, isTyping]) => isTyping && id !== user?.uid).length > 0 && (
          <div className="flex items-start">
            <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#71767b] animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#71767b] animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#71767b] animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
