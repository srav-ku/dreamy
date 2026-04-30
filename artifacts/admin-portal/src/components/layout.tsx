import { Link, useLocation } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30 font-sans flex flex-col">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2F3336]">
        <div className="max-w-2xl mx-auto w-full px-4 h-14 flex items-center justify-between">
          <Link href="/persons" className="font-bold text-lg tracking-tight hover:text-white/80 transition-colors">
            Album Admin
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
