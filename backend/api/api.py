from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

from api.features.finance.controller import (
    CategoryController,
    ExpenseController,
    FinanceAccountController,
    FinanceDashboardController,
    FinanceDataController,
    PaycheckController,
    RecurringBillController,
)
from api.features.users.controller import AuthController, UserController

api = NinjaExtraAPI()

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
)


@api.get("/hello")
async def hello(request):
    return {"message": "Hello, world!"}
