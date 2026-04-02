import { ExpensesTable } from "./components/expenses-table";
import { ExpensesSummary } from "./components/expenses-summary";
import { ExpenseDialog } from "@/features/dashboard/components/dialogs/ExpenseDialog";
import {
  getCategories,
  getRecurringBills,
  type Expense,
  type Category,
  type RecurringBill,
} from "@/lib/finance-api";
import { CreditCard, Plus } from "lucide-react";
import {
  useExpenses,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-expenses";
import { Loader2, RefreshCw } from "lucide-react";
import { PageContentLayout } from "@/components/common/page-content-layout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ExpensesPage() {
  const { data: expenses, isLoading, isError, error, refetch } = useExpenses();
  const { mutate: updateExpense } = useUpdateExpense();
  const { mutate: deleteExpense } = useDeleteExpense();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);

  useEffect(() => {
    async function loadData() {
      const [cats, bills] = await Promise.all([
        getCategories(),
        getRecurringBills(),
      ]);
      setCategories(cats);
      setRecurringBills(bills);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading expenses...</span>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
        <p className="text-destructive">
          Error loading expenses: {error?.message}
        </p>
      </main>
    );
  }

  return (
    <PageContentLayout
      title="Expenses"
      description="View and manage your recent expenses."
      icon={<CreditCard className="h-5 w-5 text-primary" />}
      scrollable={false}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      }
    >
      {expenses && expenses.length > 0 ? (
        <>
          <div className="shrink-0 mb-6">
            <ExpensesSummary expenses={expenses} />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ExpensesTable
              expenses={[...expenses].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )}
              onUpdate={(expense: Expense) =>
                updateExpense({ id: expense.id, expense: expense })
              }
              onDelete={(expenseId: number) => deleteExpense(expenseId)}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          No expenses found.
        </div>
      )}

      <ExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={categories}
        recurringBills={recurringBills}
        onSuccess={async () => {
          await refetch();
        }}
        showTrigger={false}
      />
    </PageContentLayout>
  );
}
