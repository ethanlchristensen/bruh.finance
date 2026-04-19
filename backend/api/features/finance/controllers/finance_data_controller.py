from django.db import transaction
from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import (
    Category,
    Expense,
    FinanceAccount,
    Paycheck,
    RecurringBill,
    SavingsAccount,
    SavingsRecurringDeposit,
    SavingsTransaction,
)
from api.features.finance.schemas import ExportDataSchema, FinanceDataSchema
from api.features.finance.utils import get_or_create_finance_account, get_or_create_savings_account
from api.features.users.permissons import IsApproved


from datetime import timedelta
from django.utils import timezone
from api.features.finance.services.finance_dashboard_service import FinanceDashboardService


@api_controller("/finance", auth=JWTAuth(), tags=["Finance Data"], permissions=[IsApproved])
class FinanceDataController:
    def __init__(self):
        self.dashboard_service = FinanceDashboardService()

    @route.get("", response=FinanceDataSchema)
    def get_all_finance_data(self, request):
        """Get all finance data for current user"""
        user = request.user
        account = get_or_create_finance_account(user=user)
        savings_account = get_or_create_savings_account(user=user)
        recurring_bills = RecurringBill.objects.filter(user=user, is_deleted=False)
        paychecks = Paycheck.objects.filter(user=user, is_deleted=False)
        expenses = Expense.objects.filter(user=user, is_deleted=False)
        recurring_savings = SavingsRecurringDeposit.objects.filter(
            user=user, is_deleted=False
        )
        savings_transactions = SavingsTransaction.objects.filter(
            user=user, is_deleted=False
        )

        today = timezone.now().date()
        month_start = today.replace(day=1)
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        unaccounted_spending = self.dashboard_service._calculate_unaccounted_spending(
            user, month_start, month_end
        )

        return {
            "account": account,
            "recurringBills": recurring_bills,
            "paychecks": paychecks,
            "expenses": expenses,
            "unaccounted_spending": unaccounted_spending,
            "savings_account": savings_account,
            "savings_recurring_deposits": recurring_savings,
            "savings_transactions": savings_transactions,
        }

    @route.get("/export", response=ExportDataSchema)
    def export_finance_data(self, request):
        """Export all finance data for current user including deleted items and categories"""
        user = request.user
        account = get_or_create_finance_account(user=user)
        savings_account = get_or_create_savings_account(user=user)

        return {
            "categories": Category.objects.filter(user=user),
            "account": account,
            "savings_account": savings_account,
            "recurring_bills": RecurringBill.objects.filter(user=user),
            "paychecks": Paycheck.objects.filter(user=user),
            "expenses": Expense.objects.filter(user=user),
            "savings_recurring_deposits": SavingsRecurringDeposit.objects.filter(user=user),
            "savings_transactions": SavingsTransaction.objects.filter(user=user),
        }

    @route.post("/import")
    @transaction.atomic
    def import_finance_data(self, request, data: ExportDataSchema):
        """Import all finance data for current user, wiping existing data first"""
        user = request.user

        # 1. Wipe existing data
        # Ordering matters for delete to avoid FK constraints issues,
        # but Django usually handles this. Still, let's go leaf to root where possible.
        Expense.objects.filter(user=user).delete()
        Paycheck.objects.filter(user=user).delete()
        RecurringBill.objects.filter(user=user).delete()
        SavingsTransaction.objects.filter(user=user).delete()
        SavingsRecurringDeposit.objects.filter(user=user).delete()
        Category.objects.filter(user=user).delete()
        FinanceAccount.objects.filter(user=user).delete()
        SavingsAccount.objects.filter(user=user).delete()

        # 2. Re-create Categories
        category_map = {}  # old_id -> new category object
        for cat_data in data.categories:
            cat = Category.objects.create(
                user=user,
                name=cat_data.name,
                type=cat_data.type,
                color=cat_data.color,
                is_deleted=cat_data.isDeleted,
                deleted_at=cat_data.deletedAt,
            )
            category_map[cat_data.id] = cat

        # 3. Accounts
        account = FinanceAccount.objects.create(
            user=user,
            starting_balance=data.account.startingBalance,
            current_balance=data.account.currentBalance,
            balance_as_of_date=data.account.balanceAsOfDate,
            is_deleted=data.account.isDeleted,
            deleted_at=data.account.deletedAt,
        )

        savings_account = SavingsAccount.objects.create(
            user=user,
            starting_balance=data.savingsAccount.startingBalance,
            current_balance=data.savingsAccount.currentBalance,
            balance_as_of_date=data.savingsAccount.balanceAsOfDate,
            is_deleted=data.savingsAccount.isDeleted,
            deleted_at=data.savingsAccount.deletedAt,
        )

        # 4. Recurring Bills
        bill_map = {}
        for bill_data in data.recurringBills:
            cat = category_map.get(bill_data.category.id) if bill_data.category else None
            bill = RecurringBill.objects.create(
                user=user,
                finance_account=account,
                name=bill_data.name,
                amount=bill_data.amount,
                frequency=bill_data.frequency,
                start_date=bill_data.startDate,
                due_day=bill_data.dueDay,
                day_of_week=bill_data.dayOfWeek,
                category=cat,
                total=bill_data.total,
                amount_paid=bill_data.amountPaid,
                is_deleted=bill_data.isDeleted,
                deleted_at=bill_data.deletedAt,
            )
            bill_map[bill_data.id] = bill

        # 5. Paychecks
        for pc_data in data.paychecks:
            cat = category_map.get(pc_data.category.id) if pc_data.category else None
            Paycheck.objects.create(
                user=user,
                finance_account=account,
                amount=pc_data.amount,
                date=pc_data.date,
                frequency=pc_data.frequency,
                day_of_week=pc_data.dayOfWeek,
                day_of_month=pc_data.dayOfMonth,
                second_day_of_month=pc_data.secondDayOfMonth,
                category=cat,
                is_deleted=pc_data.isDeleted,
                deleted_at=pc_data.deletedAt,
            )

        # 6. Expenses
        for exp_data in data.expenses:
            cat = category_map.get(exp_data.category.id) if exp_data.category else None
            related_bill = bill_map.get(exp_data.relatedBillId) if exp_data.relatedBillId else None
            Expense.objects.create(
                user=user,
                finance_account=account,
                name=exp_data.name,
                amount=exp_data.amount,
                date=exp_data.date,
                category=cat,
                related_bill=related_bill,
                is_deleted=exp_data.isDeleted,
                deleted_at=exp_data.deletedAt,
            )

        # 7. Savings Recurring Deposits
        for srd_data in data.savingsRecurringDeposits:
            SavingsRecurringDeposit.objects.create(
                user=user,
                savings_account=savings_account,
                name=srd_data.name,
                amount=srd_data.amount,
                frequency=srd_data.frequency,
                start_date=srd_data.startDate,
                day_of_week=srd_data.dayOfWeek,
                day_of_month=srd_data.dayOfMonth,
                is_payroll_deposit=srd_data.isPayrollDeposit,
                notes=srd_data.notes or "",
                is_deleted=srd_data.isDeleted,
                deleted_at=srd_data.deletedAt,
            )

        # 8. Savings Transactions
        for st_data in data.savingsTransactions:
            SavingsTransaction.objects.create(
                user=user,
                savings_account=savings_account,
                transaction_type=st_data.transactionType,
                amount=st_data.amount,
                date=st_data.date,
                notes=st_data.notes or "",
                is_deleted=st_data.isDeleted,
                deleted_at=st_data.deletedAt,
            )

        return {"success": True, "message": "Data imported successfully"}
