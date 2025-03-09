import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyOtpSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";

interface OtpVerificationProps {
  onSuccess: () => void;
}

export default function OtpVerification({ onSuccess }: OtpVerificationProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      token: "",
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/verify-otp", { token });
      return res.json();
    },
    onSuccess,
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Enter Verification Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => verifyOtpMutation.mutate(data.token))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      maxLength={6}
                      placeholder="Enter your 6-digit code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={verifyOtpMutation.isPending}
            >
              Verify Code
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
