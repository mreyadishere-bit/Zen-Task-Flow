import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/Calendar";
import { useTheme } from "@/hooks/use-theme";
import { StoreProvider } from "@/context/StoreContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={CalendarPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <ThemeWrapper>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </ThemeWrapper>
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
