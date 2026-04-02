import { BillDialog } from "./components/dialogs/BillDialog";
import { PaycheckDialog } from "./components/dialogs/PaycheckDialog";
import { ExpenseDialog } from "./components/dialogs/ExpenseDialog";
import { SavingsDepositDialog } from "./components/dialogs/SavingsDepositDialog";
import { SavingsTransferDialog } from "./components/dialogs/SavingsTransferDialog";
import { SavingsRecurringDialog } from "./components/dialogs/SavingsRecurringDialog";
import { ActionButtons } from "./components/ui/ActionButtons";
import { SummaryCards } from "./components/ui/SummaryCards";
import { SavingsPlanner } from "./components/ui/SavingsPlanner";
import { CalendarView } from "./components/ui/CalendarView";
import { LoadingState, ErrorState } from "./components/ui/StateComponents";
import { Button } from "@/components/ui/button";
import {
  PiggyBank,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardActions } from "./hooks/useDashboardActions";
import { useDialogState } from "./hooks/useDialogState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex-1 overflow-hidden">
      <main className="h-full p-4 flex flex-col gap-2 max-w-7xl mx-auto w-full">
        <SummaryCards
          financeData={financeData}
          calendarDays={calendarDays}
          currentDate={currentDate}
          allCalendarDays={allCalendarDays}
        />

        <div className="flex justify-between items-center bg-card rounded-lg border p-2 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Select
              value={monthsToShow.toString()}
              onValueChange={(v) => setMonthsToShow(Number.parseInt(v))}
            >
              <SelectTrigger id="months-select" className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="2">2 Months</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="4">4 Months</SelectItem>
                <SelectItem value="5">5 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1,
                    ),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1,
                    ),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Savings Planner
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader className="mb-6">
                  <SheetTitle>Savings Planner</SheetTitle>
                  <SheetDescription>
                    Manage your recurring savings deposits and view recent
                    activity.
                  </SheetDescription>
                </SheetHeader>
                <SavingsPlanner
                  recurringDeposits={financeData.savingsRecurringDeposits}
                  transactions={financeData.savingsTransactions}
                  onDeleteRecurring={handleDeleteSavingsRecurringDeposit}
                  onDeleteTransaction={handleDeleteSavingsTransaction}
                />
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add New</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => dialogState.setBillDialogOpen(true)}
                >
                  Add Bill
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => dialogState.setPaycheckDialogOpen(true)}
                >
                  Add Paycheck
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => dialogState.setExpenseDialogOpen(true)}
                >
                  Add Expense
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Savings Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => dialogState.setSavingsDepositDialogOpen(true)}
                >
                  Savings Deposit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    dialogState.setSavingsTransferDialogOpen(true)
                  }
                >
                  Savings Transfer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    dialogState.setSavingsRecurringDialogOpen(true)
                  }
                >
                  Recurring Savings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Data</DropdownMenuLabel>
                <ActionButtons
                  onDataRefresh={refreshData}
                  calendarDays={calendarDays}
                  monthsToShow={monthsToShow}
                  asMenuItems
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => refreshData()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-transparent rounded-lg shadow-sm flex flex-col min-w-0">
          <CalendarView
            currentDate={currentDate}
            monthsToShow={monthsToShow}
            calendarDays={calendarDays}
            balanceAsOfDateStr={financeData.account.balanceAsOfDate}
            onDeleteBill={handleDeleteBill}
            onDeletePaycheck={handleDeletePaycheck}
            onDeleteExpense={handleDeleteExpense}
            onDeleteSavingsTransaction={handleDeleteSavingsTransaction}
          />
        </div>

        {/* Dialogs */}
        <BillDialog
          categories={categories}
          onSuccess={refreshData}
          open={dialogState.billDialogOpen}
          onOpenChange={dialogState.setBillDialogOpen}
          showTrigger={false}
        />

        <PaycheckDialog
          onSuccess={refreshData}
          open={dialogState.paycheckDialogOpen}
          onOpenChange={dialogState.setPaycheckDialogOpen}
          showTrigger={false}
        />

        <ExpenseDialog
          categories={categories}
          recurringBills={financeData.recurringBills || []}
          onSuccess={refreshData}
          open={dialogState.expenseDialogOpen}
          onOpenChange={dialogState.setExpenseDialogOpen}
          showTrigger={false}
        />

        <SavingsDepositDialog
          onSuccess={refreshData}
          open={dialogState.savingsDepositDialogOpen}
          onOpenChange={dialogState.setSavingsDepositDialogOpen}
          showTrigger={false}
        />

        <SavingsTransferDialog
          onSuccess={refreshData}
          open={dialogState.savingsTransferDialogOpen}
          onOpenChange={dialogState.setSavingsTransferDialogOpen}
          showTrigger={false}
        />

        <SavingsRecurringDialog
          onSuccess={refreshData}
          open={dialogState.savingsRecurringDialogOpen}
          onOpenChange={dialogState.setSavingsRecurringDialogOpen}
          showTrigger={false}
        />
      </main>
    </div>
  );
}
