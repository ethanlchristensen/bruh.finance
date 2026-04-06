from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from pydantic import ValidationError
import logging

from api.features.finance.controller import (
    CategoryController,
    ExpenseController,
    FinanceAccountController,
    FinanceDashboardController,
    FinanceDataController,
    PaycheckController,
    RecurringBillController,
    SavingsAccountController,
    SavingsRecurringDepositController,
    SavingsTransactionController,
)
from api.features.users.controller import AuthController, UserController

logger = logging.getLogger(__name__)

api = NinjaExtraAPI()

@api.exception_handler(ValidationError)
def validation_errors(request, exc):
    logger.error(f"Validation Error: {exc}")
    return api.create_response(
        request,
        {"message": "Data validation error. Please check your inputs for invalid values."},
        status=422,
    )

@api.exception_handler(Exception)
def global_exception_handler(request, exc):
    logger.error(f"Unexpected Error: {exc}", exc_info=True)
    return api.create_response(
        request,
        {"message": "An unexpected error occurred on the server."},
        status=500,
    )

api.register_controllers(

    NinjaJWTDefaultController,
    AuthController,
    UserController,
    ExpenseController,
    FinanceAccountController,
    FinanceDataController,
    RecurringBillController,
    PaycheckController,
    FinanceDashboardController,
    CategoryController,
    SavingsAccountController,
    SavingsRecurringDepositController,
    SavingsTransactionController,
)


@api.get("/hello")
async def hello(request):
    return {"message": "Hello, world!"}
