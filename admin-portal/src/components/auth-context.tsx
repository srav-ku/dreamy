import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onIdTokenChanged } from "firebase/auth";
import { auth, signInWithPopup, googleProvider, signOut as firebaseSignOut } from "@/lib/firebase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setUser(user);
        setToken(idToken);
        localStorage.setItem("admin_token", idToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("admin_token");
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to sign in");
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
