import { useEffect } from "react";
import type { RecurringBill } from "@/lib/finance-api"; // Use finance-api for RecurringBill interface
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteRecurringBill } from "@/hooks/use-recurring-bills";
import { Loader2 } from "lucide-react";

interface BillDeleteDialogProps {
  bill: RecurringBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void; // Added onDelete callback
}

export function BillDeleteDialog({
  bill,
  open,
  onOpenChange,
  onDelete,
}: BillDeleteDialogProps) {
  const {
    mutate: deleteBill,
    isPending,
    isSuccess,
    reset,
  } = useDeleteRecurringBill();

  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false); // Close dialog on successful deletion
      onDelete(); // Call the onDelete callback passed from the parent
      reset(); // Reset mutation state for next use
    }
  }, [isSuccess, onOpenChange, reset, onDelete]);

  const handleDelete = () => {
    if (bill?.id) {
      deleteBill(bill.id); // Still call the mutation, but onDelete will handle closing and parent logic
    }
  };

  if (!bill) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bill</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{bill.name}</strong>? This
            action cannot be undone and will remove this recurring bill from
            your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
