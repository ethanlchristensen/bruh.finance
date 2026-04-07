import logging
import traceback

from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from pydantic import ValidationError

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
    logger.error(f"Validation Error at {request.path}: {exc}")
    # We exclude the raw input from the error details to avoid serialization issues
    # with complex Django objects like DjangoGetter/QuerySets that can be attached by Ninja
    error_details = exc.errors(include_url=False, include_context=False, include_input=False)
    return api.create_response(
        request,
        {
            "message": "Data validation error. Please check your inputs for invalid values.",
            "details": error_details,
        },
        status=422,
    )


@api.exception_handler(Exception)
def global_exception_handler(request, exc):
    user = getattr(request, "user", "Anonymous")
    logger.error(
        f"Unexpected Error: {exc}\n"
        f"Path: {request.path}\n"
        f"Method: {request.method}\n"
        f"User: {user}\n"
        f"Traceback: {traceback.format_exc()}"
    )
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
