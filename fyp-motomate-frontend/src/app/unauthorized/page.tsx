import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="container max-w-md mx-auto py-20 text-center">
      <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6">
        You do not have permission to access this page.
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
}