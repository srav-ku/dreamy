import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/components/auth-context";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import PersonsList from "@/pages/persons";
import PersonNew from "@/pages/persons/new";
import PersonEdit from "@/pages/persons/edit";
import PersonAlbums from "@/pages/persons/albums";
import AlbumNew from "@/pages/persons/albums/new";
import AlbumEdit from "@/pages/persons/albums/edit";
import AlbumUpload from "@/pages/albums/upload";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/persons">
        {() => <ProtectedRoute component={PersonsList} />}
      </Route>
      <Route path="/persons/new">
        {() => <ProtectedRoute component={PersonNew} />}
      </Route>
      <Route path="/persons/:id/edit">
        {() => <ProtectedRoute component={PersonEdit} />}
      </Route>
      <Route path="/persons/:id/albums">
        {() => <ProtectedRoute component={PersonAlbums} />}
      </Route>
      <Route path="/persons/:id/albums/new">
        {() => <ProtectedRoute component={AlbumNew} />}
      </Route>
      <Route path="/albums/:albumId/edit">
        {() => <ProtectedRoute component={AlbumEdit} />}
      </Route>
      <Route path="/albums/:albumId/upload">
        {() => <ProtectedRoute component={AlbumUpload} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
