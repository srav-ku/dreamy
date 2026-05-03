import { ReactNode, useEffect } from "react";
import { Link } from "wouter";
import { useChat } from "./chat/ChatProvider";
import { cn } from "@/lib/utils";

import { AdBanner } from "./ads/AdBanner";

export function Layout({ children, title }: { children: ReactNode; title?: string }) {
  const { isOpen } = useChat();

  // Global Popunder and Social Bar are now safely loaded in index.html


  return (
    <div className={cn(
      "min-h-dvh w-full bg-black text-[#e7e9ea] flex p-0 md:p-4 transition-all duration-300",
      isOpen ? "justify-start xl:pl-[5%] 2xl:pl-[10%]" : "justify-center"
    )}>
      {/* Desktop Sidebar Ad (Left) */}
      <div className="hidden xl:flex flex-col items-center justify-start mt-20 mr-4 w-[160px]">
        <AdBanner id="c6aca66e58288114c2fe9100b00f49ec" width={160} height={300} className="sticky top-20" />
      </div>

      <div className="w-full max-w-[600px] border-x border-[#2f3336] min-h-dvh relative flex flex-col bg-black">
        {/* Header Ad */}
        <div className="flex justify-center border-b border-[#2f3336] p-2 overflow-hidden bg-[#050505]">
          <AdBanner id="3c109a8eda4954bacf292c4aa67f6588" width={728} height={90} className="scale-[0.8] sm:scale-100 origin-top" />
        </div>

        {title && (
          <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center gap-6">
            <Link href="/" className="text-[#e7e9ea] hover:bg-[#181818] p-2 -ml-2 rounded-full transition-colors cursor-pointer">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path></g></svg>
            </Link>
            <h1 className="text-xl font-bold leading-none">{title}</h1>
          </header>
        )}
        <main className="flex-1 flex flex-col pb-16">
          {children}
        </main>
      </div>

      {/* Desktop Sidebar Ad (Right) */}
      <div className={cn(
        "hidden xl:flex flex-col items-center justify-start mt-20 ml-4 w-[160px]",
        isOpen && "xl:hidden 2xl:flex" // Hide right ad on smaller xl screens if chat is open
      )}>
        <AdBanner id="b7be7ef5c8d69708cbb121d4ab7dd7ad" width={160} height={600} className="sticky top-20" />
      </div>

      {/* Mobile Sticky Footer Ad */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center bg-black/90 z-50 md:hidden border-t border-[#2f3336] overflow-hidden">
        <AdBanner id="14ba54072c1dc52f2147a43ebb195c20" width={320} height={50} />
      </div>
    </div>
  );
}

