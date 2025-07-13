import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import Events from "@/pages/events";
import EventDetails from "@/pages/event-details";
import Checkout from "@/pages/checkout";
import type { User } from "@shared/schema";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth() as {
    isAuthenticated: boolean;
    isLoading: boolean;
    user?: User;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id" component={EventDetails} />
        </>
      ) : (
        <>
          <Route path="/" component={user?.isAdmin ? AdminDashboard : Events} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id" component={EventDetails} />
          <Route path="/checkout/:bookingId" component={Checkout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
