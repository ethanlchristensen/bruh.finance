from typing import List
from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth
from api.features.finance.models import Expense, FinanceAccount
from api.features.finance.schemas import ExpenseSchema


@api_controller("/finance/expenses", auth=JWTAuth(), tags=["Expenses"])
class ExpenseController:
    @route.get("", response=List[ExpenseSchema])
    def list_expenses(self, request):
        """List all expenses for current user"""
        return Expense.objects.filter(user=request.user)

    @route.get("/{expense_id}", response=ExpenseSchema)
    def get_expense(self, request, expense_id: int):
        """Get a specific expense"""
        return Expense.objects.get(id=expense_id, user=request.user)

    @route.post("", response={201: ExpenseSchema, 400: dict})
    def create_expense(self, request, data: ExpenseSchema):
        """Create a new expense"""
        finance_account = FinanceAccount.objects.get(user=request.user)
        expense = Expense.objects.create(
            user=request.user,
            finance_account=finance_account,
            **data.dict(exclude_unset=True, exclude={"id"}, by_alias=True)
        )
        return 201, expense

    @route.patch("/{expense_id}", response=ExpenseSchema)
    def update_expense(self, request, expense_id: int, data: ExpenseSchema):
        """Update an expense"""
        expense = Expense.objects.get(id=expense_id, user=request.user)
        for attr, value in data.dict(exclude_unset=True, exclude={"id"}, by_alias=True).items():
            setattr(expense, attr, value)
        expense.save()
        return expense

    @route.delete("/{expense_id}", response={204: None})
    def delete_expense(self, request, expense_id: int):
        """Delete an expense"""
        expense = Expense.objects.get(id=expense_id, user=request.user)
        expense.delete()
        return 204, None
