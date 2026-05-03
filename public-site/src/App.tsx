import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/home";
import { PersonPage } from "@/pages/person";
import { AlbumPage } from "@/pages/album";
import { Search } from "@/pages/search";
import NotFound from "@/pages/not-found";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/p/:personSlug" component={PersonPage} />
      <Route path="/p/:personSlug/:albumSlug" component={AlbumPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <ChatWidget />
        </ChatProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
