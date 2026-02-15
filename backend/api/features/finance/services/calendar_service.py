from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.contrib.auth.models import User

from api.features.finance.models import Expense, FinanceAccount, Paycheck, RecurringBill


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

        # Get all data
        bills = list(RecurringBill.objects.filter(user=user).select_related("category"))
        paychecks = list(Paycheck.objects.filter(user=user).select_related("category"))
        expenses = list(Expense.objects.filter(user=user).select_related("category"))

        # Track bill payments for bills with totals
        bill_payments = {}
        for bill in bills:
            if bill.total:
                bill_payments[bill.id] = bill.amount_paid or Decimal("0.00")

        # Generate calendar days
        calendar_days = []
        running_balance = account.starting_balance
        current_date = calc_start_date

        while current_date <= calc_end_date:
            should_calculate = current_date >= balance_date

            # Get items for this day
            day_bills = (
                self._get_bills_for_date(bills, current_date, bill_payments)
                if should_calculate
                else []
            )
            day_paychecks = (
                self._get_paychecks_for_date(paychecks, current_date) if should_calculate else []
            )
            day_expenses = (
                self._get_expenses_for_date(expenses, current_date) if should_calculate else []
            )

            # Calculate balance changes
            if should_calculate:
                for pc in day_paychecks:
                    running_balance += pc.amount

                for bill in day_bills:
                    running_balance -= bill.amount
                    if bill.total:
                        bill_payments[bill.id] = (
                            bill_payments.get(bill.id, Decimal("0.00")) + bill.amount
                        )

                for exp in day_expenses:
                    # Subtract expense amount from running balance
                    running_balance -= exp.amount

                    # If this expense is related to a bill (e.g. paying off a credit card),
                    # we should also apply it towards that bill's total payment if applicable.
                    # This logic assumes the 'expense' represents the payment being made.
                    if hasattr(exp, "related_bill") and exp.related_bill:
                        # Find the bill in our bill_payments tracker
                        related_bill_id = exp.related_bill.id
                        if related_bill_id in bill_payments:
                            # This assumes the expense amount counts towards paying off the bill
                            bill_payments[related_bill_id] += exp.amount
                        elif exp.related_bill.total:
                            # Initialize tracking for this bill if we haven't seen it due yet but paying it early?
                            # Or if it was just missed in initial scan (unlikely if passed in bills list)
                            bill_payments[related_bill_id] = exp.amount

            calendar_days.append(
                {
                    "date": current_date.isoformat(),
                    "isCurrentMonth": True,
                    "bills": [
                        {
                            "id": bill.id,
                            "name": bill.name,
                            "amount": bill.amount,
                            "dueDay": bill.due_day,
                            "category": bill.category,
                            "total": bill.total,
                            "amountPaid": bill_payments.get(bill.id, Decimal("0.00"))
                            if bill.total
                            else None,
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
                    "runningBalance": running_balance if should_calculate else Decimal("0.00"),
                }
            )

            current_date += timedelta(days=1)

        return calendar_days

    def _get_bills_for_date(
        self, bills: List[RecurringBill], target_date: date, bill_payments: Dict[int, Decimal]
    ) -> List[RecurringBill]:
        """Get bills due on a specific date"""
        # Get last day of month
        if target_date.month == 12:
            last_day_of_month = 31
        else:
            next_month = date(target_date.year, target_date.month + 1, 1)
            last_day_of_month = (next_month - timedelta(days=1)).day

        matching_bills = []
        for bill in bills:
            due_day = bill.due_day
            current_day = target_date.day

            # Check if bill is due on this day
            is_correct_day = (due_day == current_day) or (
                due_day > last_day_of_month and current_day == last_day_of_month
            )

            # Check if bill is paid off
            if bill.total:
                current_paid = bill_payments.get(bill.id, Decimal("0.00"))
                is_paid_off = current_paid >= bill.total
            else:
                is_paid_off = False

            if is_correct_day and not is_paid_off:
                matching_bills.append(bill)

        return matching_bills

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
                }

            balance = day["runningBalance"]
            month_data["min_balance"] = min(month_data["min_balance"], balance)
            month_data["max_balance"] = max(month_data["max_balance"], balance)
            month_data["end_balance"] = balance

        if month_data:
            projections.append(month_data)

        return projections
