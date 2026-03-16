import { useState } from "react";
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

  const defaultCategory = categories.find(
    (cat) => cat.type === "expense" || cat.type === "general",
  );
  const defaultCategoryId = defaultCategory?.id.toString() || "";

  const activeCategoryId = expenseForm.category_id || defaultCategoryId;

  const handleAddExpense = async () => {
    try {
      const expense = {
        name: expenseForm.name,
        amount: Number.parseFloat(expenseForm.amount),
        date: expenseForm.date,
        category_id: Number.parseInt(activeCategoryId),
        ...(expenseForm.relatedBillId !== "none" && {
          relatedBillId: Number.parseInt(expenseForm.relatedBillId),
        }),
      };

      await addExpense(expense);
      await onSuccess();

      setExpenseForm({
        name: "",
        amount: "",
        date: "",
        category_id: "",
        relatedBillId: "none",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  return {
    expenseForm: {
      ...expenseForm,
      category_id: activeCategoryId,
    },
    setExpenseForm,
    handleAddExpense,
  };
}
