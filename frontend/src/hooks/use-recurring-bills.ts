import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringBills,
  getRecurringBill,
  addRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  type RecurringBill,
} from "@/lib/finance-api";
import { toast } from "sonner";

export const recurringBillKeys = {
  all: ["recurring-bills"] as const,
  lists: () => [...recurringBillKeys.all, "list"] as const,
  list: (filters: string) =>
    [...recurringBillKeys.lists(), { filters }] as const,
  details: () => [...recurringBillKeys.all, "detail"] as const,
  detail: (id: number) => [...recurringBillKeys.details(), id] as const,
};

export function useRecurringBills() {
  return useQuery({
    queryKey: recurringBillKeys.lists(),
    queryFn: getRecurringBills,
  });
}

export function useRecurringBill(id: number) {
  return useQuery({
    queryKey: recurringBillKeys.detail(id),
    queryFn: () => getRecurringBill(id),
    enabled: !!id,
  });
}

export function useAddRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRecurringBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      toast.success("Recurring bill added successfully");
    },
    onError: (error) => {
      console.error("Failed to add recurring bill:", error);
      toast.error("Failed to add recurring bill");
    },
  });
}

export function useUpdateRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bill }: { id: number; bill: Partial<RecurringBill> }) =>
      updateRecurringBill(id, bill),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: recurringBillKeys.detail(data.id),
      });
      toast.success("Recurring bill updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update recurring bill:", error);
      toast.error("Failed to update recurring bill");
    },
  });
}

export function useDeleteRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecurringBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      toast.success("Recurring bill deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete recurring bill:", error);
      toast.error("Failed to delete recurring bill");
    },
  });
}
