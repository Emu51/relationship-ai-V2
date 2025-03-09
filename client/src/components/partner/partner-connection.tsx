import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateUserSchema, User } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, UserMinus } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function PartnerConnection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      partnerId: undefined,
      partnerType: "",
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { partnerId: number; partnerType: string }) => {
      const res = await apiRequest("POST", "/api/partner/connect", data);
      return res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Partner connected",
        description: "You are now in a relationship",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect partner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partner/disconnect");
      return res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Partner disconnected",
        description: "You are now single",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect partner",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Relationship Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user?.partnerId ? (
          <div className="space-y-4">
            <p className="text-sm">
              You are in a relationship as a {user.partnerType}
            </p>
            <Button
              variant="destructive"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="w-full"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              End Relationship
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => connectMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner ID</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partnerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="husband">Husband</SelectItem>
                        <SelectItem value="wife">Wife</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={connectMutation.isPending}
              >
                <Heart className="h-4 w-4 mr-2" />
                Connect Partner
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
