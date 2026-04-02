import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpenses,
  getExpense,
  addExpense,
  updateExpense,
  deleteExpense,
  type Expense,
} from "@/lib/finance-api";
import { toast } from "sonner";

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (filters: string) => [...expenseKeys.lists(), { filters }] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
};

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: getExpenses,
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => getExpense(id),
    enabled: !!id,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["finance-data"] });
      toast.success("Expense added successfully");
    },
    onError: (error) => {
      console.error("Failed to add expense:", error);
      toast.error("Failed to add expense");
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, expense }: { id: number; expense: Partial<Expense> }) =>
      updateExpense(id, expense),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["finance-data"] });
      queryClient.invalidateQueries({
        queryKey: expenseKeys.detail(data.id),
      });
      toast.success("Expense updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update expense:", error);
      toast.error("Failed to update expense");
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["finance-data"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    },
  });
}
