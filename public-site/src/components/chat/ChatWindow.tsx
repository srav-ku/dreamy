import React from "react";
import { useChat } from "./ChatProvider";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export const ChatWindow = () => {
  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col bg-black">
        <MessageList />
      </div>

      <div className="p-3 border-t border-[#2f3336] bg-black">
        <MessageInput />
      </div>
    </>
  );
};
