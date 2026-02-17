import { useState } from "react";
import { propagatePaychecks } from "@/lib/finance-api";

export function usePaycheckDialog(
  onSuccess: () => Promise<void>,
  onOpenChange: (open: boolean) => void,
) {
  const [paycheckForm, setPaycheckForm] = useState({
    amount: "",
    date: "",
    frequency: "biweekly" as string,
    secondDay: "",
  });

  const handleAddPaycheck = async () => {
    try {
      const paycheck = {
        amount: Number.parseFloat(paycheckForm.amount),
        date: paycheckForm.date,
        frequency: paycheckForm.frequency,
        ...(paycheckForm.secondDay && {
          secondDayOfMonth: Number.parseInt(paycheckForm.secondDay),
        }),
      };

      await propagatePaychecks(paycheck);
      await onSuccess();
      
      // Reset form
      setPaycheckForm({
        amount: "",
        date: "",
        frequency: "biweekly",
        secondDay: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add paycheck:", error);
    }
  };

  return {
    paycheckForm,
    setPaycheckForm,
    handleAddPaycheck,
  };
}
