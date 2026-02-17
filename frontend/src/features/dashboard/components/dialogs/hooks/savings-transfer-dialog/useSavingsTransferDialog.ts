import { useState } from "react";
import { addSavingsTransaction } from "@/lib/finance-api";

export function useSavingsTransferDialog(
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [savingsTransferForm, setSavingsTransferForm] = useState({
    amount: "",
    date: (() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    })(),
    notes: "",
  });

  const handleTransferToChecking = async () => {
    try {
      const amount = Number.parseFloat(savingsTransferForm.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        alert("Enter a valid transfer amount.");
        return;
      }

      await addSavingsTransaction({
        transactionType: "transfer_to_checking",
        amount,
        date: savingsTransferForm.date,
        ...(savingsTransferForm.notes && { notes: savingsTransferForm.notes }),
      });

      await onSuccess();
      
      const today = new Date().toISOString().split("T")[0];
      setSavingsTransferForm({ amount: "", date: today, notes: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to transfer from savings:", error);
      alert("Failed to transfer funds. Please try again.");
    }
  };

  return {
    savingsTransferForm,
    setSavingsTransferForm,
    handleTransferToChecking,
  };
}
