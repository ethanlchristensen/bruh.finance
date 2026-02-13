from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth
from api.features.finance.models import FinanceAccount, RecurringBill, Paycheck, Expense
from api.features.finance.schemas import FinanceDataSchema


@api_controller("/finance", auth=JWTAuth(), tags=["Finance Data"])
class FinanceDataController:
    @route.get("/", response=FinanceDataSchema)
    def get_all_finance_data(self, request):
        """Get all finance data for current user"""
        account = FinanceAccount.objects.get(user=request.user)
        recurring_bills = RecurringBill.objects.filter(user=request.user)
        paychecks = Paycheck.objects.filter(user=request.user)
        expenses = Expense.objects.filter(user=request.user)

        return {
            "account": account,
            "recurringBills": recurring_bills,
            "paychecks": paychecks,
            "expenses": expenses,
        }
