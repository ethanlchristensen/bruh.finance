import logging
from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import Category, Expense, FinanceAccount
from api.features.finance.schemas import ExpenseSchema
from api.features.users.permissons import IsApproved

logger = logging.getLogger(__name__)


@api_controller("/finance/expenses", auth=JWTAuth(), tags=["Expenses"], permissions=[IsApproved])
class ExpenseController:
    @route.get("", response=List[ExpenseSchema])
    def list_expenses(self, request):
        """List all expenses for current user"""
        logger.debug(f"User {request.user} listing expenses")
        return Expense.objects.filter(user=request.user, is_deleted=False).select_related(
            "category"
        )

    @route.get("/{expense_id}", response=ExpenseSchema)
    def get_expense(self, request, expense_id: int):
        """Get a specific expense"""
        logger.debug(f"User {request.user} getting expense {expense_id}")
        try:
            return Expense.objects.select_related("category").get(
                id=expense_id, user=request.user, is_deleted=False
            )
        except Expense.DoesNotExist:
            logger.warning(f"Expense {expense_id} not found for user {request.user}")
            raise

    @route.post("", response={201: ExpenseSchema, 400: dict})
    def create_expense(self, request, data: ExpenseSchema):
        """Create a new expense"""
        logger.info(f"User {request.user} creating expense: {data.name}")
        try:
            finance_account = FinanceAccount.objects.get(user=request.user)
            payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id", "category"})

            category_id = data.category_id
            if category_id:
                category = Category.objects.get(id=category_id, user=request.user)
                payload["category"] = category

            expense = Expense.objects.create(
                user=request.user, finance_account=finance_account, **payload
            )
            logger.info(f"Successfully created expense {expense.id} for user {request.user}")
            return 201, expense
        except Exception as e:
            logger.error(f"Error creating expense for user {request.user}: {str(e)}", exc_info=True)
            raise

    @route.patch("/{expense_id}", response=ExpenseSchema)
    def update_expense(self, request, expense_id: int, data: ExpenseSchema):
        """Update an expense"""
        logger.info(f"User {request.user} updating expense {expense_id}")
        try:
            expense = Expense.objects.get(id=expense_id, user=request.user)
            payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id", "category"})

            category_id = data.category_id
            if category_id:
                category = Category.objects.get(id=category_id, user=request.user)
                expense.category = category

            for attr, value in payload.items():
                setattr(expense, attr, value)
            expense.save()
            logger.info(f"Successfully updated expense {expense_id} for user {request.user}")
            return expense
        except Expense.DoesNotExist:
            logger.warning(f"Expense {expense_id} not found for user {request.user} during update")
            raise
        except Exception as e:
            logger.error(
                f"Error updating expense {expense_id} for user {request.user}: {str(e)}",
                exc_info=True,
            )
            raise

    @route.delete("/{expense_id}", response={204: None})
    def delete_expense(self, request, expense_id: int):
        """Soft delete an expense"""
        logger.info(f"User {request.user} deleting expense {expense_id}")
        try:
            expense = Expense.objects.get(id=expense_id, user=request.user)
            expense.soft_delete()
            logger.info(f"Successfully deleted expense {expense_id} for user {request.user}")
            return 204, None
        except Expense.DoesNotExist:
            logger.warning(f"Expense {expense_id} not found for user {request.user} during delete")
            raise
        except Exception as e:
            logger.error(
                f"Error deleting expense {expense_id} for user {request.user}: {str(e)}",
                exc_info=True,
            )
            raise
