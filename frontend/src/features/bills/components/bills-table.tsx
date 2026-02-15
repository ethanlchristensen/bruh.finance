"use client";

import { useState } from "react";
import type { RecurringBill } from "@/lib/finance-api";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BillRow } from "./bill-row";
import { BillEditDialog } from "./bill-edit-dialog";
import { BillDeleteDialog } from "./bill-delete-dialog";

interface BillsTableProps {
  bills: RecurringBill[];
  onUpdate: (bill: RecurringBill) => void;
  onDelete: (billId: number) => void;
}

export function BillsTable({ bills, onUpdate, onDelete }: BillsTableProps) {
  const [editBill, setEditBill] = useState<RecurringBill | null>(null);
  const [deleteBill, setDeleteBill] = useState<RecurringBill | null>(null);

  return (
    <>
      <div className="rounded-lg border bg-card relative h-full overflow-auto">
        <Table className="rounded-lg">
          <TableHeader className="sticky top-0 z-10 bg-card rounded-lg">
            <TableRow className="hover:bg-transparent rounded-lg">
              <TableHead className="w-50 rounded-lg">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-25 text-right rounded-lg">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                onEdit={setEditBill}
                onDelete={setDeleteBill}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <BillEditDialog
        bill={editBill}
        open={!!editBill}
        onOpenChange={(open) => !open && setEditBill(null)}
        onSave={(updated) => {
          if (editBill) {
            onUpdate({ ...editBill, ...updated });
          }
          setEditBill(null);
        }}
      />

      <BillDeleteDialog
        bill={deleteBill}
        open={!!deleteBill}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBill(null);
          }
        }}
        onDelete={() => {
          if (deleteBill) {
            onDelete(deleteBill.id);
          }
          setDeleteBill(null);
        }}
      />
    </>
  );
}
