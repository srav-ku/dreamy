import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, doc, setDoc, onSnapshot, query, orderBy, limit, 
  serverTimestamp, getDoc, deleteDoc, getDocs, writeBatch, 
  where, Timestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type ChatType = "group" | "dm";

export interface ChatThread {
  id: string;
  type: ChatType;
  participants: string[];
  otherUserNickname?: string;
  lastMessage?: string;
  updatedAt?: any;
}

interface ChatContextType {
  user: User | null;
  nickname: string;
  onlineCount: number;
  onlineUsers: Record<string, boolean>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeChat: ChatThread | null;
  setActiveChat: (chat: ChatThread | null) => void;
  view: "group" | "dms";
  setView: (view: "group" | "dms") => void;
  dms: ChatThread[];
  startDM: (userId: string, nickname: string) => Promise<void>;
  updateActivity: () => Promise<void>;
  lightboxImage: string | null;
  setLightboxImage: (url: string | null) => void;
  replyTo: any;
  setReplyTo: (msg: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatThread | null>({ id: "global", type: "group", participants: [] });
  const [view, setView] = useState<"group" | "dms">("group");
  const [dms, setDms] = useState<ChatThread[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);

  // --- 1. SESSION & CLEANUP LOGIC ---
  
  const performCleanup = useCallback(async () => {
    console.log("[Chat] Performing Global 24h Privacy Cleanup...");
    const batch = writeBatch(db);
    const now = Date.now();
    const expiryTime = now - 86400000; // 24 hours ago

    // 1. Cleanup Global Messages
    const messagesRef = collection(db, "global_chat", "data", "messages");
    const msgSnapshot = await getDocs(query(messagesRef, limit(400)));
    msgSnapshot.docs.forEach((d) => batch.delete(d.ref));

    // 2. Cleanup Stale DM Threads & their messages
    const chatsRef = collection(db, "chats");
    const expiredChats = await getDocs(query(chatsRef, where("updatedAt", "<", Timestamp.fromMillis(expiryTime)), limit(50)));
    
    for (const chatDoc of expiredChats.docs) {
      // Delete the chat document itself
      batch.delete(chatDoc.ref);
      
      // Attempt to delete sub-messages (recursive-like)
      const subMsgs = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
      subMsgs.docs.forEach(m => batch.delete(m.ref));
    }

    // 3. Cleanup Presence/User Data
    const membersRef = collection(db, "global_chat", "data", "members");
    const memberSnapshot = await getDocs(query(membersRef, limit(100)));
    memberSnapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();

    // Reset session timer for the next 24 hours
    const sessionRef = doc(db, "global_chat", "session");
    await setDoc(sessionRef, {
      startTime: serverTimestamp(),
      lastActivity: serverTimestamp()
    });
    
    console.log("[Chat] Cleanup Complete.");
  }, []);

  const checkSession = useCallback(async () => {
    const sessionRef = doc(db, "global_chat", "session");
    const snap = await getDoc(sessionRef);
    const now = Date.now();

    if (!snap.exists()) {
      await performCleanup();
      return;
    }

    const { startTime, lastActivity } = snap.data();
    const startMs = startTime?.toMillis() || now;
    const lastMs = lastActivity?.toMillis() || now;

    const IS_24H_EXPIRED = now - startMs > 86400000;
    const IS_INACTIVE_10M = now - lastMs > 600000 && onlineCount <= 1; // self is only one

    if (IS_24H_EXPIRED || IS_INACTIVE_10M) {
      await performCleanup();
    }
  }, [onlineCount, performCleanup]);

  const updateActivity = async () => {
    const sessionRef = doc(db, "global_chat", "session");
    await setDoc(sessionRef, { lastActivity: serverTimestamp() }, { merge: true });
  };

  // --- 2. DM SYSTEM ---

  const startDM = async (otherUserId: string, otherNickname: string) => {
    console.log("[Chat] startDM initiated:", { currentUserId: user?.uid, targetUserId: otherUserId, targetNickname: otherNickname });
    if (!user) {
      console.error("[Chat] Cannot start DM: No authenticated user");
      return;
    }
    if (user.uid === otherUserId) {
      console.warn("[Chat] Cannot start DM with yourself");
      return;
    }

    const chatId = [user.uid, otherUserId].sort().join("_");
    console.log("[Chat] Generated ChatId:", chatId);
    const chatRef = doc(db, "chats", chatId);
    
    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        console.log("[Chat] Creating new DM thread...");
        await setDoc(chatRef, {
          participants: [user.uid, otherUserId],
          nicknames: {
            [user.uid]: nickname,
            [otherUserId]: otherNickname
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "Started a conversation"
        });
      }

      console.log("[Chat] Setting active chat to:", chatId);
      setActiveChat({
        id: chatId,
        type: "dm",
        participants: [user.uid, otherUserId],
        otherUserNickname: otherNickname
      });
      setView("dms");
      setIsOpen(true);
    } catch (err) {
      console.error("[Chat] startDM failed:", err);
    }
  };

  // --- 3. LIFECYCLE ---

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        let storedNickname = localStorage.getItem("chat_nickname");
        if (!storedNickname) {
          storedNickname = `Guest${Math.floor(Math.random() * 9000) + 1000}`;
          localStorage.setItem("chat_nickname", storedNickname);
        }
        setNickname(storedNickname);

        // Presence
        const memberRef = doc(db, "global_chat", "data", "members", u.uid);
        
        const updatePresence = () => {
          setDoc(memberRef, {
            userId: u.uid,
            nickname: storedNickname,
            lastSeen: serverTimestamp(),
          }, { merge: true });
        };

        const removePresence = () => {
          // Use a basic delete as fallback for window closure
          deleteDoc(memberRef).catch(() => {});
        };

        updatePresence();
        const interval = setInterval(updatePresence, 20000);
        
        // Immediate cleanup when closing tab
        window.addEventListener("beforeunload", removePresence);
        
        return () => {
          clearInterval(interval);
          window.removeEventListener("beforeunload", removePresence);
          removePresence();
        };
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Presence & Online Count
  useEffect(() => {
    const membersRef = collection(db, "global_chat", "data", "members");
    const unsubscribe = onSnapshot(query(membersRef), (snapshot) => {
      const now = Date.now();
      const onlineMap: Record<string, boolean> = {};
      const online = snapshot.docs.filter((d) => {
        const data = d.data();
        if (!data.lastSeen) {
          onlineMap[d.id] = true;
          return true;
        }
        const isOnline = now - data.lastSeen.toMillis() < 60000;
        if (isOnline) onlineMap[d.id] = true;
        return isOnline;
      });
      setOnlineCount(online.length);
      setOnlineUsers(onlineMap);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup Interval
  useEffect(() => {
    checkSession(); // On Open
    const interval = setInterval(checkSession, 120000); // Every 2 mins
    return () => clearInterval(interval);
  }, [checkSession]);

  // Fetch DM Threads
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(d => {
        const data = d.data();
        const otherUserId = data.participants.find((p: string) => p !== user.uid);
        return {
          id: d.id,
          type: "dm" as ChatType,
          participants: data.participants,
          otherUserNickname: data.nicknames?.[otherUserId] || "Unknown",
          lastMessage: data.lastMessage,
          updatedAt: data.updatedAt
        };
      });
      setDms(threads);
    });
  }, [user]);

  return (
    <ChatContext.Provider value={{ 
      user, nickname, onlineCount, onlineUsers, isOpen, setIsOpen, 
      activeChat, setActiveChat, view, setView, dms, startDM, updateActivity,
      lightboxImage, setLightboxImage, replyTo, setReplyTo
    }}>
      {children}
    </ChatContext.Provider>
  );
};
