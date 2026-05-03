import React, { useState } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useChat } from "./ChatProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePickerModal } from "./ImagePickerModal";

export const MessageInput = () => {
  const { user, nickname, activeChat, updateActivity } = useChat();
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedImage) || !user || !activeChat || sending) return;

    setSending(true);
    try {
      const messageData = {
        text: text.trim(),
        userId: user.uid,
        nickname,
        createdAt: serverTimestamp(),
        ...(selectedImage && { imageRef: selectedImage }),
      };

      if (activeChat.id === "global") {
        await addDoc(collection(db, "global_chat", "data", "messages"), messageData);
        await updateActivity();
      } else {
        await addDoc(collection(db, "chats", activeChat.id, "messages"), messageData);
        await updateDoc(doc(db, "chats", activeChat.id), {
          lastMessage: text.trim() || "Sent an image",
          updatedAt: serverTimestamp()
        });
      }

      setText("");
      setSelectedImage(null);
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      {selectedImage && (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#2f3336] bg-[#16181c] shadow-lg animate-in zoom-in-95 duration-200">
          <img 
            src={selectedImage.imageUrl} 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1 hover:bg-black/90 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSend} className="flex items-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full text-[#1d9bf0] hover:bg-[#1d9bf0]/10 flex-shrink-0 transition-colors"
          onClick={() => setIsPickerOpen(true)}
        >
          <ImageIcon className="h-6 w-6" />
        </Button>
        
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#16181c] border border-[#2f3336] focus:border-[#1d9bf0] focus:ring-0 rounded-2xl text-[15px] px-4 py-2.5 min-h-[44px] max-h-32 resize-none transition-all outline-none text-[#e7e9ea]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        
        <Button
          type="submit"
          size="icon"
          disabled={(!text.trim() && !selectedImage) || sending}
          className="h-11 w-11 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white disabled:opacity-50 flex-shrink-0 shadow-lg transition-transform active:scale-95"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      <ImagePickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={(img) => {
          setSelectedImage(img);
          setIsPickerOpen(false);
        }}
      />
    </div>
  );
};
