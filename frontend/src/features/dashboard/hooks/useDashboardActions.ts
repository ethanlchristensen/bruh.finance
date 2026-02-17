import { useCallback } from "react";
import {
  deleteRecurringBill,
  deletePaycheck,
  deleteExpense,
  deleteSavingsTransaction,
  deleteSavingsRecurringDeposit,
} from "@/lib/finance-api";

export function useDashboardActions(refreshData: () => Promise<void>) {
  const handleDeleteBill = useCallback(
    async (id: number) => {
      try {
        await deleteRecurringBill(id);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete bill:", error);
      }
    },
    [refreshData],
  );

  const handleDeletePaycheck = useCallback(
    async (id: number) => {
      try {
        await deletePaycheck(id);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete paycheck:", error);
      }
    },
    [refreshData],
  );

  const handleDeleteExpense = useCallback(
    async (id: number) => {
      try {
        await deleteExpense(id);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    },
    [refreshData],
  );

  const handleDeleteSavingsTransaction = useCallback(
    async (id: number) => {
      try {
        const numericId = Number(id);
        if (Number.isNaN(numericId)) return;
        await deleteSavingsTransaction(numericId);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete savings transaction:", error);
      }
    },
    [refreshData],
  );

  const handleDeleteSavingsRecurringDeposit = useCallback(
    async (id: number) => {
      try {
        await deleteSavingsRecurringDeposit(id);
        await refreshData();
      } catch (error) {
        console.error("Failed to delete recurring savings deposit:", error);
      }
    },
    [refreshData],
  );

  return {
    handleDeleteBill,
    handleDeletePaycheck,
    handleDeleteExpense,
    handleDeleteSavingsTransaction,
    handleDeleteSavingsRecurringDeposit,
  };
}
