import { useState, useEffect } from "react";
import { addRecurringBill, type Category } from "@/lib/finance-api";

export function useBillDialog(
  categories: Category[],
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    dueDay: "",
    category_id: "",
    total: "",
  });

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !billForm.category_id) {
      const billCategory = categories.find(
        (cat) => cat.type === "bill" || cat.type === "general",
      );
      if (billCategory) {
        setBillForm((prev) => ({
          ...prev,
          category_id: billCategory.id.toString(),
        }));
      }
    }
  }, [categories, billForm.category_id]);

  const handleAddBill = async () => {
    try {
      const bill = {
        name: billForm.name,
        amount: Number.parseFloat(billForm.amount),
        dueDay: Number.parseInt(billForm.dueDay),
        category_id: Number.parseInt(billForm.category_id),
        ...(billForm.total && {
          total: Number.parseFloat(billForm.total),
          amountPaid: 0,
        }),
      };
      await addRecurringBill(bill);
      await onSuccess();
      
      // Reset form
      setBillForm({
        name: "",
        amount: "",
        dueDay: "",
        category_id:
          categories
            .find((cat) => cat.type === "bill" || cat.type === "general")
            ?.id.toString() || "",
        total: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add bill:", error);
    }
  };

  return {
    billForm,
    setBillForm,
    handleAddBill,
  };
}
