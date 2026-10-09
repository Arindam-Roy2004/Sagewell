import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 shadow-xs">
        <Compass className="size-5 text-muted-foreground" />
      </span>
      <p className="mt-6 text-sm text-brand-app">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        The page <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{location.pathname}</code> doesn't exist or has
        moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">
          <ArrowLeft /> Back to home
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
