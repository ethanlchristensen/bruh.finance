import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getCategoryChoices,
  addCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/finance-api";
import { toast } from "sonner";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  choices: () => [...categoryKeys.all, "choices"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getCategories,
  });
}

export function useCategoryChoices() {
  return useQuery({
    queryKey: categoryKeys.choices(),
    queryFn: getCategoryChoices,
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      console.error("Failed to create category:", error);
      toast.error(error.message || "Failed to create category");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      category,
    }: {
      id: number;
      category: Partial<Category>;
    }) => updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to update category:", error);
      toast.error(error.message || "Failed to update category");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to delete category:", error);
      toast.error(error.message || "Failed to delete category");
    },
  });
}
