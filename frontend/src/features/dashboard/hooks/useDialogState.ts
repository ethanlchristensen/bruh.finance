import { useState, useCallback } from "react";

export function useDialogState() {
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [paycheckDialogOpen, setPaycheckDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [savingsDepositDialogOpen, setSavingsDepositDialogOpen] = useState(false);
  const [savingsTransferDialogOpen, setSavingsTransferDialogOpen] = useState(false);
  const [savingsRecurringDialogOpen, setSavingsRecurringDialogOpen] = useState(false);

  // You can also add generic toggle functions here if you want
  // e.g., toggleBillDialog, closeAllDialogs, etc.

  return {
    billDialogOpen,
    setBillDialogOpen,
    paycheckDialogOpen,
    setPaycheckDialogOpen,
    expenseDialogOpen,
    setExpenseDialogOpen,
    savingsDepositDialogOpen,
    setSavingsDepositDialogOpen,
    savingsTransferDialogOpen,
    setSavingsTransferDialogOpen,
    savingsRecurringDialogOpen,
    setSavingsRecurringDialogOpen,
  };
}
