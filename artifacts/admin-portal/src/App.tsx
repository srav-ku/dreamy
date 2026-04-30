import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import PersonsList from "@/pages/persons";
import PersonNew from "@/pages/persons/new";
import PersonEdit from "@/pages/persons/edit";
import PersonAlbums from "@/pages/persons/albums";
import AlbumNew from "@/pages/persons/albums/new";
import AlbumUpload from "@/pages/albums/upload";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component, ...rest }: any) {
  const token = localStorage.getItem("admin_token");
  if (!token) {
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
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}

export default App;
