import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertChatSchema, Chat } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessagesSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertChatSchema),
    defaultValues: {
      message: "",
    },
  });

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="h-[calc(100vh-12rem)] bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessagesSquare className="h-5 w-5" />
          Chat with AI Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {chats.map((chat) => (
              <div key={chat.id} className="space-y-2">
                <div className="bg-primary/10 backdrop-blur-sm p-3 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">You</p>
                  <p className="text-sm">{chat.message}</p>
                </div>
                <div className="bg-primary/20 backdrop-blur-sm p-3 rounded-lg border border-primary/30">
                  <p className="text-sm font-medium text-primary">AI Advisor</p>
                  <p className="text-sm">{chat.response}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => chatMutation.mutate(data.message))}
            className="flex gap-2"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Type your message..."
                      className="resize-none bg-primary/5 border-primary/20 focus:border-primary/50"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={chatMutation.isPending} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}