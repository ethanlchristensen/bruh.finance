"use client";

import { useState } from "react";
import type { Expense } from "@/lib/finance-api";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseRow } from "./expense-row";
import { ExpenseEditDialog } from "./expense-edit-dialog";
import { ExpenseDeleteDialog } from "./expense-delete-dialog";

interface ExpensesTableProps {
  expenses: Expense[];
  onUpdate: (expense: Expense) => void;
  onDelete: (expenseId: number) => void;
}

export function ExpensesTable({
  expenses,
  onUpdate,
  onDelete,
}: ExpensesTableProps) {
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  return (
    <>
      <div className="rounded-lg border bg-card relative h-full overflow-auto">
        <Table className="rounded-lg">
          <TableHeader className="sticky top-0 z-10 bg-card rounded-lg">
            <TableRow className="hover:bg-transparent rounded-lg">
              <TableHead className="w-50 rounded-lg">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-25 text-right rounded-lg">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={setEditExpense}
                onDelete={setDeleteExpense}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ExpenseEditDialog
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
        onSave={(updated) => {
          if (editExpense) {
            onUpdate({ ...editExpense, ...updated });
          }
          setEditExpense(null);
        }}
      />

      <ExpenseDeleteDialog
        expense={deleteExpense}
        open={!!deleteExpense}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteExpense(null);
          }
        }}
        onDelete={() => {
          if (deleteExpense) {
            onDelete(deleteExpense.id);
          }
          setDeleteExpense(null);
        }}
      />
    </>
  );
}
