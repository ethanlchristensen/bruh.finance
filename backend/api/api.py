from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController

from api.features.users.controller import AuthController, UserController
from api.features.finance.controller import (
    ExpenseController,
    FinanceDataController,
    FinanceAccountController,
    RecurringBillController,
    PaycheckController,
    FinanceDashboardController
)

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
    FinanceDashboardController
)


@api.get("/hello")
async def hello(request):
    return {"message": "Hello, world!"}
