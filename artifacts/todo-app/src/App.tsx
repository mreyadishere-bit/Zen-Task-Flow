import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/Calendar";
import DisciplinePage from "@/pages/Discipline";
import { useTheme } from "@/hooks/use-theme";
import { StoreProvider } from "@/context/StoreContext";
import { TimerProvider, useTimer } from "@/context/TimerContext";
import { FocusTimerPanel } from "@/components/focus/FocusTimerPanel";
import { cn } from "@/lib/utils";

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
      <Route path="/discipline" component={DisciplinePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

function SplitLayout({ children }: { children: React.ReactNode }) {
  const { isPanelOpen } = useTimer();
  return (
    <div className="flex min-h-screen">
      {/* Content side — shrinks to make room for the timer panel */}
      <div
        className={cn(
          "min-w-0 overflow-x-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isPanelOpen
            ? "w-full md:w-[60%] lg:w-1/2"
            : "w-full"
        )}
      >
        {children}
      </div>
      {/* Timer panel — fixed right side */}
      <FocusTimerPanel />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TimerProvider>
          <TooltipProvider>
            <ThemeWrapper>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <SplitLayout>
                  <Router />
                </SplitLayout>
              </WouterRouter>
              <Toaster />
            </ThemeWrapper>
          </TooltipProvider>
        </TimerProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
