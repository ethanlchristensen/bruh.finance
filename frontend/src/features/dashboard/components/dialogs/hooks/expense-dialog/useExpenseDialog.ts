import { useState, useEffect } from "react";
import { addExpense, type Category } from "@/lib/finance-api";

export function useExpenseDialog(
  categories: Category[],
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    date: "",
    category_id: "",
    relatedBillId: "none",
  });

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !expenseForm.category_id) {
      const expenseCategory = categories.find(
        (cat) => cat.type === "expense" || cat.type === "general",
      );
      if (expenseCategory) {
        setExpenseForm((prev) => ({
          ...prev,
          category_id: expenseCategory.id.toString(),
        }));
      }
    }
  }, [categories, expenseForm.category_id]);

  const handleAddExpense = async () => {
    try {
      const expense = {
        name: expenseForm.name,
        amount: Number.parseFloat(expenseForm.amount),
        date: expenseForm.date,
        category_id: Number.parseInt(expenseForm.category_id),
        ...(expenseForm.relatedBillId !== "none" && {
          relatedBillId: Number.parseInt(expenseForm.relatedBillId),
        }),
      };
      await addExpense(expense);
      await onSuccess();
      
      // Reset form
      setExpenseForm({
        name: "",
        amount: "",
        date: "",
        category_id:
          categories
            .find((cat) => cat.type === "expense" || cat.type === "general")
            ?.id.toString() || "",
        relatedBillId: "none",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  return {
    expenseForm,
    setExpenseForm,
    handleAddExpense,
  };
}
