import { useState } from "react";
import { addRecurringBill, type Category } from "@/lib/finance-api";

export function useBillDialog(
  categories: Category[],
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    dueDay: "",
    dayOfWeek: "",
    category_id: "",
    total: "",
  });

  const defaultCategory = categories.find(
    (cat) => cat.type === "bill" || cat.type === "general",
  );
  const defaultCategoryId = defaultCategory?.id.toString() || "";

  const activeCategoryId = billForm.category_id || defaultCategoryId;

  const handleAddBill = async () => {
    try {
      const bill = {
        name: billForm.name,
        amount: Number.parseFloat(billForm.amount),
        frequency: billForm.frequency,
        startDate: billForm.startDate,
        ...(billForm.frequency === "monthly" &&
          billForm.dueDay && {
            dueDay: Number.parseInt(billForm.dueDay),
          }),
        ...((billForm.frequency === "weekly" ||
          billForm.frequency === "biweekly") &&
          billForm.dayOfWeek && {
            dayOfWeek: Number.parseInt(billForm.dayOfWeek),
          }),
        category_id: Number.parseInt(activeCategoryId),
        ...(billForm.total && {
          total: Number.parseFloat(billForm.total),
          amountPaid: 0,
        }),
      };
      await addRecurringBill(bill);
      await onSuccess();

      setBillForm({
        name: "",
        amount: "",
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        dueDay: "",
        dayOfWeek: "",
        category_id: "",
        total: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add bill:", error);
    }
  };

  return {
    billForm: { ...billForm, category_id: activeCategoryId },
    setBillForm,
    handleAddBill,
  };
}
