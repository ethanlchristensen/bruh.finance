import { useState } from "react";
import {
  addSavingsRecurringDeposit,
  type SavingsRecurringDeposit,
} from "@/lib/finance-api";

export function useSavingsRecurringDialog(
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [savingsRecurringForm, setSavingsRecurringForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    startDate: (() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    })(),
    dayOfWeek: new Date().getDay().toString(),
    dayOfMonth: new Date().getDate().toString(),
    isPayrollDeposit: false,
    notes: "",
  });

  const handleAddSavingsRecurringDeposit = async () => {
    try {
      const amount = Number.parseFloat(savingsRecurringForm.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        alert("Enter a valid contribution amount.");
        return;
      }

      const payload: Omit<SavingsRecurringDeposit, "id"> = {
        name: savingsRecurringForm.name,
        amount,
        frequency: savingsRecurringForm.frequency,
        startDate: savingsRecurringForm.startDate,
        isPayrollDeposit: savingsRecurringForm.isPayrollDeposit,
        notes: savingsRecurringForm.notes || undefined,
      };

      if (["weekly", "biweekly"].includes(savingsRecurringForm.frequency)) {
        if (savingsRecurringForm.dayOfWeek) {
          payload.dayOfWeek = Number.parseInt(savingsRecurringForm.dayOfWeek);
        }
        payload.dayOfMonth = undefined;
      } else if (savingsRecurringForm.frequency === "monthly") {
        if (savingsRecurringForm.dayOfMonth) {
          payload.dayOfMonth = Number.parseInt(savingsRecurringForm.dayOfMonth);
        }
        payload.dayOfWeek = undefined;
      }

      await addSavingsRecurringDeposit(payload);

      await onSuccess();

      const today = new Date();
      setSavingsRecurringForm({
        name: "",
        amount: "",
        frequency: "monthly",
        startDate: today.toISOString().split("T")[0],
        dayOfWeek: today.getDay().toString(),
        dayOfMonth: today.getDate().toString(),
        isPayrollDeposit: false,
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add recurring savings deposit:", error);
      alert("Failed to add recurring savings deposit. Please try again.");
    }
  };

  return {
    savingsRecurringForm,
    setSavingsRecurringForm,
    handleAddSavingsRecurringDeposit,
  };
}
