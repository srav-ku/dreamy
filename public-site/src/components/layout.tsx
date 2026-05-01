import { ReactNode } from "react";
import { Link } from "wouter";

export function Layout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-[100dvh] w-full bg-black text-[#e7e9ea] flex justify-center">
      <div className="w-full max-w-[600px] border-x border-[#2f3336] min-h-[100dvh] relative flex flex-col">
        {title && (
          <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center gap-6">
            <Link href="/" className="text-[#e7e9ea] hover:bg-[#181818] p-2 -ml-2 rounded-full transition-colors cursor-pointer">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
            </Link>
            <h1 className="text-xl font-bold leading-none">{title}</h1>
          </header>
        )}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
