import { ReactNode, useEffect } from "react";
import { Link } from "wouter";

function useAdScript(src: string, options?: { key?: string; format?: string; height?: number; width?: number; params?: object }) {
  useEffect(() => {
    if (options) {
      (window as any).atOptions = options;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [src, options]);
}

function usePopunderScript(src: string) {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    const injectPopunder = () => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
      window.removeEventListener("click", injectPopunder);
    };

    window.addEventListener("click", injectPopunder);
    return () => window.removeEventListener("click", injectPopunder);
  }, [src]);
}

export function Layout({ children, title }: { children: ReactNode; title?: string }) {
  // Load Social Bar
  useAdScript("https://archaicmsflip.com/e1/ab/4b/e1ab4b0bc37f88a613c19c41e37220d2.js");
  
  // Load Popunder (Desktop Only, Trigger on First Interaction)
  usePopunderScript("https://archaicmsflip.com/a7/2c/09/a72c095e59410703b58981164af49968.js");
  
  // Load Header Ad (728x90)
  useAdScript("https://archaicmsflip.com/3c109a8eda4954bacf292c4aa67f6588/invoke.js", { 'key' : '3c109a8eda4954bacf292c4aa67f6588', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} });
  
  // Load Sidebar Ads
  useAdScript("https://archaicmsflip.com/c6aca66e58288114c2fe9100b00f49ec/invoke.js", { 'key' : 'c6aca66e58288114c2fe9100b00f49ec', 'format' : 'iframe', 'height' : 300, 'width' : 160, 'params' : {} });
  useAdScript("https://archaicmsflip.com/b7be7ef5c8d69708cbb121d4ab7dd7ad/invoke.js", { 'key' : 'b7be7ef5c8d69708cbb121d4ab7dd7ad', 'format' : 'iframe', 'height' : 600, 'width' : 160, 'params' : {} });
  
  // Load Mobile Footer Ad
  useAdScript("https://archaicmsflip.com/14ba54072c1dc52f2147a43ebb195c20/invoke.js", { 'key' : '14ba54072c1dc52f2147a43ebb195c20', 'format' : 'iframe', 'height' : 50, 'width' : 320, 'params' : {} });

  return (
    <div className="min-h-[100dvh] w-full bg-black text-[#e7e9ea] flex justify-center p-0 md:p-4">
      {/* Desktop Sidebar Ad (Left) */}
      <div className="hidden xl:flex flex-col items-center justify-start mt-20 mr-4 w-[160px]">
        <div id="container-c6aca66e58288114c2fe9100b00f49ec"></div>
      </div>

      <div className="w-full max-w-[600px] border-x border-[#2f3336] min-h-[100dvh] relative flex flex-col bg-black">
        {/* Header Ad */}
        <div className="flex justify-center border-b border-[#2f3336] p-2">
           <div id="container-3c109a8eda4954bacf292c4aa67f6588"></div>
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
      <div className="hidden xl:flex flex-col items-center justify-start mt-20 ml-4 w-[160px]">
        <div id="container-b7be7ef5c8d69708cbb121d4ab7dd7ad"></div>
      </div>

      {/* Mobile Sticky Footer Ad */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center bg-black/90 z-50 md:hidden border-t border-[#2f3336]">
        <div id="container-14ba54072c1dc52f2147a43ebb195c20"></div>
      </div>
    </div>
  );
}
