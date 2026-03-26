import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NotFound } from "@/components/errors/not-found";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_protected/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<User[]>("/users/"),
    enabled: !!currentUser?.is_staff, // Only run the query if the user is staff
  });

  const approveMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/users/${userId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User approved");
    },
    onError: () => toast.error("Failed to approve user"),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/users/${userId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User rejected");
    },
    onError: () => toast.error("Failed to reject user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  if (!currentUser?.is_staff) {
    return <NotFound />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.profile?.status === "APPROVED"
                        ? "default"
                        : user.profile?.status === "PENDING"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {user.profile?.status || "PENDING"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.date_joined).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {user.id === currentUser?.id ? (
                      <Badge variant="secondary" className="mr-2">
                        You
                      </Badge>
                    ) : (
                      <>
                        {user.profile?.status !== "APPROVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => approveMutation.mutate(user.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {user.profile?.status !== "REJECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            onClick={() => rejectMutation.mutate(user.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the user account
                                for <strong>{user.username}</strong> (
                                {user.email}). All associated data will be
                                removed. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(user.id)}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              >
                                Yes, delete account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
