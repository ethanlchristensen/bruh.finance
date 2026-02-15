import { BillsTable } from "./components/bills-table";
import { BillsSummary } from "./components/bills-summary";
import type { RecurringBill } from "@/lib/finance-api";
import { Receipt } from "lucide-react";
import {
  useRecurringBills,
  useUpdateRecurringBill,
  useDeleteRecurringBill,
} from "@/hooks/use-recurring-bills";
import { Loader2 } from "lucide-react";
import { PageContentLayout } from "@/components/common/page-content-layout";

export default function BillsPage() {
  const { data: bills, isLoading, isError, error } = useRecurringBills();
  const { mutate: updateBill } = useUpdateRecurringBill();
  const { mutate: deleteBill } = useDeleteRecurringBill();

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading bills...</span>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
        <p className="text-destructive">
          Error loading recurring bills: {error?.message}
        </p>
      </main>
    );
  }

  return (
    <PageContentLayout
      title="Recurring Bills"
      description="Manage and track your monthly subscriptions and bills."
      icon={<Receipt className="h-5 w-5 text-primary" />}
      scrollable={false}
    >
      {bills && bills.length > 0 ? (
        <>
          <div className="shrink-0">
            <BillsSummary bills={bills} />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <BillsTable
              bills={bills}
              onUpdate={(bill: RecurringBill) =>
                updateBill({ id: bill.id, bill: bill })
              }
              onDelete={(billId: number) => deleteBill(billId)}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          No recurring bills found.
        </div>
      )}
    </PageContentLayout>
  );
}
