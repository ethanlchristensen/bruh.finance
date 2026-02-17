import { useState } from "react";
import { addSavingsTransaction } from "@/lib/finance-api";

export function useSavingsDepositDialog(
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [savingsDepositForm, setSavingsDepositForm] = useState({
    amount: "",
    date: (() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    })(),
    notes: "",
  });

  const handleAddSavingsDeposit = async () => {
    try {
      const amount = Number.parseFloat(savingsDepositForm.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        alert("Enter a valid deposit amount.");
        return;
      }

      await addSavingsTransaction({
        transactionType: "deposit",
        amount,
        date: savingsDepositForm.date,
        ...(savingsDepositForm.notes && { notes: savingsDepositForm.notes }),
      });

      await onSuccess();
      
      const today = new Date().toISOString().split("T")[0];
      setSavingsDepositForm({ amount: "", date: today, notes: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add savings deposit:", error);
      alert("Failed to add savings deposit. Please try again.");
    }
  };

  return {
    savingsDepositForm,
    setSavingsDepositForm,
    handleAddSavingsDeposit,
  };
}
