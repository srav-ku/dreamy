import { Link } from "wouter";
import { useAuth } from "./auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 font-sans flex flex-col">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2F3336]">
        <div className="max-w-2xl mx-auto w-full px-4 h-14 flex items-center justify-between">
          <Link href="/persons" className="font-bold text-lg tracking-tight hover:text-white/80 transition-colors">
            Album Admin
          </Link>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 pr-2 border-r border-[#2F3336]">
                <Avatar className="h-7 w-7 border border-[#2F3336]">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                  <AvatarFallback className="bg-[#16181C] text-[10px] text-[#71767B]">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-xs text-[#71767B] max-w-[100px] truncate">
                  {user.displayName || user.email}
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm font-medium text-white/60 hover:text-[#f4212e] transition-colors p-2 rounded-full hover:bg-[#f4212e]/10 flex items-center gap-2"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
