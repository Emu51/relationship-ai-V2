import { useAuth } from "@/hooks/use-auth";
import ChatInterface from "@/components/chat/chat-interface";
import PartnerConnection from "@/components/partner/partner-connection";
import { Button } from "@/components/ui/button";
import { Heart, LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Relationship AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[300px,1fr]">
        <aside>
          <PartnerConnection />
        </aside>
        <div>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
