import { BillDialog } from "./components/dialogs/BillDialog";
import { PaycheckDialog } from "./components/dialogs/PaycheckDialog";
import { ExpenseDialog } from "./components/dialogs/ExpenseDialog";
import { SavingsDepositDialog } from "./components/dialogs/SavingsDepositDialog";
import { SavingsTransferDialog } from "./components/dialogs/SavingsTransferDialog";
import { SavingsRecurringDialog } from "./components/dialogs/SavingsRecurringDialog";
import { ActionButtons } from "./components/ui/ActionButtons";
import { Header } from "./components/ui/Header";
import { SummaryCards } from "./components/ui/SummaryCards";
import { SavingsPlanner } from "./components/ui/SavingsPlanner";
import { CalendarView } from "./components/ui/CalendarView";
import { LoadingState, ErrorState } from "./components/ui/StateComponents";

import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardActions } from "./hooks/useDashboardActions";
import { useDialogState } from "./hooks/useDialogState";

export default function DashboardPage() {
  const {
    financeData,
    categories,
    calendarDays,
    allCalendarDays,
    isLoading,
    error,
    currentDate,
    setCurrentDate,
    monthsToShow,
    setMonthsToShow,
    refreshData,
  } = useDashboardData();

  const {
    handleDeleteBill,
    handleDeletePaycheck,
    handleDeleteExpense,
    handleDeleteSavingsTransaction,
    handleDeleteSavingsRecurringDeposit,
  } = useDashboardActions(refreshData);

  const dialogState = useDialogState();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !financeData) {
    return <ErrorState error={error || "Failed to load data"} />;
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <main className="container mx-auto p-6 flex flex-col gap-2 pb-14">
        <Header monthsToShow={monthsToShow} setMonthsToShow={setMonthsToShow} />

        <div className="container mx-auto flex items-center p-2 bg-card rounded-lg border">
          <div className="flex items-center justify-start gap-2 w-full">
            <BillDialog
              categories={categories}
              onSuccess={refreshData}
              open={dialogState.billDialogOpen}
              onOpenChange={dialogState.setBillDialogOpen}
            />

            <PaycheckDialog
              onSuccess={refreshData}
              open={dialogState.paycheckDialogOpen}
              onOpenChange={dialogState.setPaycheckDialogOpen}
            />

            <ExpenseDialog
              categories={categories}
              recurringBills={financeData.recurringBills || []}
              onSuccess={refreshData}
              open={dialogState.expenseDialogOpen}
              onOpenChange={dialogState.setExpenseDialogOpen}
            />

            <SavingsDepositDialog
              onSuccess={refreshData}
              open={dialogState.savingsDepositDialogOpen}
              onOpenChange={dialogState.setSavingsDepositDialogOpen}
            />

            <SavingsTransferDialog
              onSuccess={refreshData}
              open={dialogState.savingsTransferDialogOpen}
              onOpenChange={dialogState.setSavingsTransferDialogOpen}
            />

            <SavingsRecurringDialog
              onSuccess={refreshData}
              open={dialogState.savingsRecurringDialogOpen}
              onOpenChange={dialogState.setSavingsRecurringDialogOpen}
            />

            <ActionButtons
              onDataRefresh={refreshData}
              calendarDays={calendarDays}
              monthsToShow={monthsToShow}
            />
          </div>
        </div>

        <SummaryCards
          financeData={financeData}
          calendarDays={calendarDays}
          currentDate={currentDate}
          allCalendarDays={allCalendarDays}
        />

        <SavingsPlanner
          recurringDeposits={financeData.savingsRecurringDeposits}
          transactions={financeData.savingsTransactions}
          onDeleteRecurring={handleDeleteSavingsRecurringDeposit}
          onDeleteTransaction={handleDeleteSavingsTransaction}
        />

        <CalendarView
          currentDate={currentDate}
          monthsToShow={monthsToShow}
          calendarDays={calendarDays}
          balanceAsOfDateStr={financeData.account.balanceAsOfDate}
          onPreviousMonth={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
            )
          }
          onNextMonth={() =>
            setCurrentDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
            )
          }
          onDeleteBill={handleDeleteBill}
          onDeletePaycheck={handleDeletePaycheck}
          onDeleteExpense={handleDeleteExpense}
          onDeleteSavingsTransaction={handleDeleteSavingsTransaction}
        />
      </main>
    </div>
  );
}
