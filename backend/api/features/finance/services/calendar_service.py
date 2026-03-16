from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.contrib.auth.models import User

from api.features.finance.models import (
    Expense,
    FinanceAccount,
    Paycheck,
    RecurringBill,
    SavingsAccount,
    SavingsRecurringDeposit,
    SavingsTransaction,
)


class CalendarService:
    def generate_calendar_data(
        self,
        user: User,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        months_to_show: int = 3,
    ) -> List[Dict[str, Any]]:
        """Generate calendar data with running balances"""

        # Get account
        try:
            account = FinanceAccount.objects.get(user=user)
        except FinanceAccount.DoesNotExist:
            raise ValueError("No finance account found")

        balance_date = account.balance_as_of_date

        # Calculate start and end dates
        if not start_date:
            calc_start_date = date(balance_date.year, balance_date.month, 1)
        else:
            calc_start_date = start_date

        if not end_date:
            calc_end_date = balance_date + timedelta(days=365 * 2)  # 2 years
        else:
            calc_end_date = end_date

        # Ensure savings account exists for forecasting
        savings_account, _ = SavingsAccount.objects.get_or_create(
            user=user,
            defaults={
                "starting_balance": Decimal("0.00"),
                "current_balance": Decimal("0.00"),
                "balance_as_of_date": balance_date,
            },
        )

        # Get all data

        bills = list(
            RecurringBill.objects.filter(user=user, is_deleted=False).select_related("category")
        )
        paychecks = list(
            Paycheck.objects.filter(user=user, is_deleted=False).select_related("category")
        )
        expenses = list(
            Expense.objects.filter(user=user, is_deleted=False).select_related("category")
        )
        recurring_savings = list(
            SavingsRecurringDeposit.objects.filter(user=user, is_deleted=False)
        )
        savings_transactions = list(SavingsTransaction.objects.filter(user=user, is_deleted=False))

        # Track bill payments for bills with totals
        # Initialize with database values only
        # We'll update this as we process expenses day-by-day
        bill_payments = {}
        for bill in bills:
            if bill.total:
                bill_payments[bill.id] = bill.amount_paid or Decimal("0.00")

        # Initialize running balances
        running_balance = Decimal("0.00")
        savings_running_balance = Decimal("0.00")

        # If calc_start_date is after balance_date, we need to calculate the balance
        # at calc_start_date by processing all transactions from balance_date to calc_start_date
        if calc_start_date > balance_date:
            # Start with the balance as of the balance_date
            running_balance = account.starting_balance
            savings_running_balance = savings_account.starting_balance

            # Process all transactions from balance_date to calc_start_date (exclusive)
            temp_date = balance_date
            while temp_date < calc_start_date:
                day_bills = self._get_bills_for_date(bills, temp_date, bill_payments)
                day_paychecks = self._get_paychecks_for_date(paychecks, temp_date)
                day_expenses = self._get_expenses_for_date(expenses, temp_date)
                day_savings_transactions = self._get_savings_transactions_for_date(
                    savings_transactions, temp_date
                )
                day_recurring_savings = self._get_recurring_savings_for_date(
                    recurring_savings, temp_date
                )

                # Update bill_payments tracking
                for exp in day_expenses:
                    if hasattr(exp, "related_bill") and exp.related_bill and exp.related_bill.total:
                        related_bill_id = exp.related_bill.id
                        if related_bill_id in bill_payments:
                            bill_payments[related_bill_id] += exp.amount
                        else:
                            bill_payments[related_bill_id] = exp.amount

                for bill in day_bills:
                    if bill.total:
                        if bill.id in bill_payments:
                            bill_payments[bill.id] += bill.amount
                        else:
                            bill_payments[bill.id] = bill.amount

                # Calculate balance changes
                for pc in day_paychecks:
                    running_balance += pc.amount

                for bill in day_bills:
                    running_balance -= bill.amount

                for exp in day_expenses:
                    running_balance -= exp.amount

                for savings_txn in day_savings_transactions:
                    if savings_txn.transaction_type == "deposit":
                        running_balance -= savings_txn.amount
                        savings_running_balance += savings_txn.amount
                    elif savings_txn.transaction_type == "transfer_to_checking":
                        running_balance += savings_txn.amount
                        savings_running_balance -= savings_txn.amount

                for recurring_deposit in day_recurring_savings:
                    if not getattr(recurring_deposit, "is_payroll_deposit", False):
                        running_balance -= recurring_deposit.amount
                    savings_running_balance += recurring_deposit.amount

                temp_date += timedelta(days=1)

        # Generate calendar days
        calendar_days = []
        current_date = calc_start_date

        while current_date <= calc_end_date:
            day_bills = self._get_bills_for_date(bills, current_date, bill_payments)
            day_paychecks = self._get_paychecks_for_date(paychecks, current_date)
            day_expenses = self._get_expenses_for_date(expenses, current_date)
            day_savings_transactions = self._get_savings_transactions_for_date(
                savings_transactions, current_date
            )
            day_recurring_savings = self._get_recurring_savings_for_date(
                recurring_savings, current_date
            )

            # Only set initial balance if we haven't already calculated it
            # (i.e., when export starts at or before balance_date)
            if current_date == balance_date and calc_start_date <= balance_date:
                running_balance = account.starting_balance
                savings_running_balance = savings_account.starting_balance

            should_update_balance = current_date >= balance_date

            # Update bill_payments for ALL dates (not just after balance_date)
            # This ensures expenses before balance_date still mark bills as paid
            for exp in day_expenses:
                if hasattr(exp, "related_bill") and exp.related_bill and exp.related_bill.total:
                    related_bill_id = exp.related_bill.id
                    if related_bill_id in bill_payments:
                        bill_payments[related_bill_id] += exp.amount
                    else:
                        bill_payments[related_bill_id] = exp.amount

            # Count recurring bill payments toward total for ALL dates
            for bill in day_bills:
                if bill.total:
                    if bill.id in bill_payments:
                        bill_payments[bill.id] += bill.amount
                    else:
                        bill_payments[bill.id] = bill.amount

            # Calculate balance changes (only after balance_date)
            if should_update_balance:
                for pc in day_paychecks:
                    running_balance += pc.amount

                for bill in day_bills:
                    running_balance -= bill.amount

                for exp in day_expenses:
                    running_balance -= exp.amount

                for savings_txn in day_savings_transactions:
                    if savings_txn.transaction_type == "deposit":
                        running_balance -= savings_txn.amount
                        savings_running_balance += savings_txn.amount
                    elif savings_txn.transaction_type == "transfer_to_checking":
                        running_balance += savings_txn.amount
                        savings_running_balance -= savings_txn.amount

                for recurring_deposit in day_recurring_savings:
                    if not getattr(recurring_deposit, "is_payroll_deposit", False):
                        running_balance -= recurring_deposit.amount
                    savings_running_balance += recurring_deposit.amount

            day_savings_entries = [
                {
                    "id": txn.id,
                    "transaction_type": txn.transaction_type,
                    "amount": txn.amount,
                    "date": txn.date.isoformat(),
                    "notes": txn.notes,
                    "source": txn.notes
                    or (
                        "Transfer to Checking"
                        if txn.transaction_type == "transfer_to_checking"
                        else "Savings Deposit"
                    ),
                    "is_recurring": False,
                }
                for txn in day_savings_transactions
            ]

            for recurring_deposit in day_recurring_savings:
                # Generate a unique integer ID for recurring transactions (negative to avoid collision)
                # Format: -{deposit_id}{YYYYMMDD}
                virtual_id = int(f"{recurring_deposit.id}{current_date.strftime('%Y%m%d')}") * -1

                is_payroll = getattr(recurring_deposit, "is_payroll_deposit", False)
                source_name = recurring_deposit.name
                if is_payroll:
                    source_name += " (Payroll Deduction)"

                day_savings_entries.append(
                    {
                        "id": virtual_id,
                        "transaction_type": "deposit",
                        "amount": recurring_deposit.amount,
                        "date": current_date.isoformat(),
                        "notes": recurring_deposit.notes,
                        "source": source_name,
                        "is_recurring": True,
                        "is_payroll_deposit": is_payroll,
                    }
                )

            calendar_days.append(
                {
                    "date": current_date.isoformat(),
                    "isCurrentMonth": True,
                    "bills": [
                        {
                            "id": bill.id,
                            "name": bill.name,
                            "amount": bill.amount,
                            "frequency": bill.frequency,
                            "dueDay": bill.due_day,
                            "category": bill.category,
                            "total": bill.total,
                            "amountPaid": (
                                bill_payments.get(bill.id, Decimal("0.00")) if bill.total else None
                            ),
                        }
                        for bill in day_bills
                    ],
                    "paychecks": [
                        {
                            "id": pc.id,
                            "amount": pc.amount,
                            "date": pc.date.isoformat(),
                            "frequency": pc.frequency,
                            "category": pc.category,
                        }
                        for pc in day_paychecks
                    ],
                    "expenses": [
                        {
                            "id": exp.id,
                            "name": exp.name,
                            "amount": exp.amount,
                            "date": exp.date.isoformat(),
                            "category": exp.category,
                        }
                        for exp in day_expenses
                    ],
                    "savingsTransactions": day_savings_entries,
                    "runningBalance": (running_balance if should_update_balance else 0.00),
                    "savingsRunningBalance": (
                        savings_running_balance if should_update_balance else 0.00
                    ),
                }
            )

            current_date += timedelta(days=1)

        return calendar_days

    def _get_bills_for_date(
        self,
        bills: List[RecurringBill],
        target_date: date,
        bill_payments: Dict[int, Decimal],
    ) -> List[RecurringBill]:
        """Get bills due on a specific date"""
        matching_bills = []
        for bill in bills:
            # Check if bill is due on this day using frequency
            if self._is_bill_on_date(bill, target_date):
                # Check if bill is paid off
                if bill.total:
                    current_paid = bill_payments.get(bill.id, Decimal("0.00"))
                    is_paid_off = current_paid >= bill.total
                else:
                    is_paid_off = False

                if not is_paid_off:
                    matching_bills.append(bill)

        return matching_bills

    def _is_bill_on_date(self, bill: RecurringBill, target_date: date) -> bool:
        """Check if a bill occurs on a specific date based on frequency"""
        # If target date is before the bill start date, it doesn't occur
        if target_date < bill.start_date:
            return False

        frequency = bill.frequency.lower() if bill.frequency else "monthly"

        if frequency == "once":
            return target_date == bill.start_date

        elif frequency == "weekly":
            # Occurs every 7 days from start_date
            days_diff = (target_date - bill.start_date).days
            return days_diff >= 0 and days_diff % 7 == 0

        elif frequency == "biweekly":
            # Occurs every 14 days from start_date
            days_diff = (target_date - bill.start_date).days
            return days_diff >= 0 and days_diff % 14 == 0

        elif frequency == "monthly":
            # Occurs on the same day each month
            if bill.due_day:
                # Get last day of month
                if target_date.month == 12:
                    last_day_of_month = 31
                else:
                    next_month = date(target_date.year, target_date.month + 1, 1)
                    last_day_of_month = (next_month - timedelta(days=1)).day

                # Check if bill is due on this day
                is_correct_day = (bill.due_day == target_date.day) or (
                    bill.due_day > last_day_of_month and target_date.day == last_day_of_month
                )
                return is_correct_day and target_date >= bill.start_date
            # Fallback: use start_date's day of month
            return target_date.day == bill.start_date.day and target_date >= bill.start_date

        # Default: only on the exact date
        return target_date == bill.start_date

    def _get_paychecks_for_date(
        self, paychecks: List[Paycheck], target_date: date
    ) -> List[Paycheck]:
        """Get paychecks for a specific date (including recurring)"""
        matching_paychecks = []

        for pc in paychecks:
            # Check if this paycheck occurs on target_date
            if self._is_paycheck_on_date(pc, target_date):
                matching_paychecks.append(pc)

        return matching_paychecks

    def _is_paycheck_on_date(self, paycheck: Paycheck, target_date: date) -> bool:
        """Check if a paycheck occurs on a specific date based on frequency"""
        # If target date is before the paycheck start date, it doesn't occur
        if target_date < paycheck.date:
            return False

        frequency = paycheck.frequency.lower()

        if frequency == "once":
            return target_date == paycheck.date

        elif frequency == "weekly":
            # Occurs every week on the specified day_of_week
            if paycheck.day_of_week is not None:
                return (
                    target_date.weekday() == paycheck.day_of_week and target_date >= paycheck.date
                )
            # Fallback: use initial date's day of week
            return target_date.weekday() == paycheck.date.weekday() and target_date >= paycheck.date

        elif frequency == "biweekly":
            # Occurs every 2 weeks on the specified day_of_week
            if paycheck.day_of_week is not None:
                # Check if it's the right day of week
                if target_date.weekday() != paycheck.day_of_week:
                    return False
                # Check if it's the right 2-week interval from start date
                days_diff = (target_date - paycheck.date).days
                weeks_diff = days_diff // 7
                return weeks_diff % 2 == 0
            # Fallback: calculate from initial date
            days_diff = (target_date - paycheck.date).days
            return days_diff >= 0 and days_diff % 14 == 0

        elif frequency == "bimonthly":
            # Occurs twice a month
            # First payment is on the primary date (day_of_month or date.day)
            first_day = paycheck.day_of_month if paycheck.day_of_month else paycheck.date.day

            # Second payment is on second_day_of_month if provided, otherwise assume ~15 days later
            if hasattr(paycheck, "second_day_of_month") and paycheck.second_day_of_month:
                second_day = paycheck.second_day_of_month
            else:
                # Default logic: 1st & 15th, or 15th & Last Day
                if first_day <= 15:
                    second_day = first_day + 15
                else:
                    # If first day is > 15 (e.g. 20th), maybe second day is next month?
                    # Or maybe user meant 5th & 20th.
                    # Without explicit second day, let's assume -15 days for the "earlier" payment in the month
                    second_day = first_day - 15

            # Get last day of current target month
            last_day_of_month = (
                date(target_date.year, target_date.month % 12 + 1, 1) - timedelta(days=1)
            ).day

            # Check matches
            is_first_day = (target_date.day == first_day) or (
                first_day > last_day_of_month and target_date.day == last_day_of_month
            )

            is_second_day = (target_date.day == second_day) or (
                second_day > last_day_of_month and target_date.day == last_day_of_month
            )

            return (is_first_day or is_second_day) and target_date >= paycheck.date

        elif frequency == "monthly":
            # Occurs on the same day each month
            if paycheck.day_of_month:
                # Handle months with fewer days
                if target_date.month == 2:
                    last_day = (
                        29
                        if target_date.year % 4 == 0
                        and (target_date.year % 100 != 0 or target_date.year % 400 == 0)
                        else 28
                    )
                elif target_date.month in [4, 6, 9, 11]:
                    last_day = 30
                else:
                    last_day = 31

                target_day = min(paycheck.day_of_month, last_day)
                return target_date.day == target_day and target_date >= paycheck.date
            # Fallback: use initial date's day of month
            return target_date.day == paycheck.date.day and target_date >= paycheck.date

        # Default: only on the exact date
        return target_date == paycheck.date

    def _get_expenses_for_date(self, expenses: List[Expense], target_date: date) -> List[Expense]:
        """Get expenses for a specific date"""
        return [exp for exp in expenses if exp.date == target_date]

    def _get_recurring_savings_for_date(
        self, deposits: List[SavingsRecurringDeposit], target_date: date
    ) -> List[SavingsRecurringDeposit]:
        """Get recurring savings deposits scheduled for a specific date"""
        matching = []
        for deposit in deposits:
            if self._is_recurring_savings_on_date(deposit, target_date):
                matching.append(deposit)
        return matching

    def _get_savings_transactions_for_date(
        self, transactions: List[SavingsTransaction], target_date: date
    ) -> List[SavingsTransaction]:
        """Get savings transactions for a specific date"""
        return [txn for txn in transactions if txn.date == target_date]

    def _is_recurring_savings_on_date(
        self, deposit: SavingsRecurringDeposit, target_date: date
    ) -> bool:
        # 1. Never show before start date
        if target_date < deposit.start_date:
            return False

        # 2. Normalize frequency string (handles "Bi-Weekly", "bi-weekly")
        frequency = (deposit.frequency or "").lower().replace("-", "").replace("_", "").strip()

        # 3. Handle Weekly/Biweekly using simple day math relative to Start Date
        #    This guarantees the Start Date is included and ignores conflicting day_of_week settings.
        if frequency == "weekly":
            days_diff = (target_date - deposit.start_date).days
            return days_diff % 7 == 0

        if frequency == "biweekly":
            days_diff = (target_date - deposit.start_date).days
            return days_diff % 14 == 0

        # 4. Handle Monthly (Complex logic for end-of-month dates)
        if frequency == "monthly":
            # Prefer the explicit day_of_month, fallback to start_date.day
            day_of_month = deposit.day_of_month if deposit.day_of_month else deposit.start_date.day

            # Logic to handle short months (e.g. if day iser
            #  31st, use 30th for April)
            if target_date.month == 12:
                last_day = 31
            else:
                next_month = date(target_date.year, target_date.month % 12 + 1, 1)
                last_day = (next_month - timedelta(days=1)).day

            target_day = min(day_of_month, last_day)

            return target_date.day == target_day

        # Default: If no recurring freq matches, treat as one-time
        return target_date == deposit.start_date

    def get_balance_projections(self, user: User, months: int = 24) -> List[Dict[str, Any]]:
        """Get balance projections for future months"""
        calendar_data = self.generate_calendar_data(user=user, months_to_show=months)

        projections = []
        current_month = None
        month_data = None

        for day in calendar_data:
            day_date = datetime.fromisoformat(day["date"]).date()
            month_key = f"{day_date.year}-{day_date.month:02d}"

            if month_key != current_month:
                if month_data:
                    projections.append(month_data)
                current_month = month_key
                month_data = {
                    "month": month_key,
                    "min_balance": float("inf"),
                    "max_balance": float("-inf"),
                    "end_balance": Decimal("0.00"),
                    "savings_end_balance": Decimal("0.00"),
                }

            balance = day["runningBalance"]
            savings_balance = day.get("savingsRunningBalance", Decimal("0.00"))

            month_data["min_balance"] = min(month_data["min_balance"], balance)
            month_data["max_balance"] = max(month_data["max_balance"], balance)
            month_data["end_balance"] = balance
            month_data["savings_end_balance"] = savings_balance

        if month_data:
            projections.append(month_data)

        return projections
