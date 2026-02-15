from datetime import date, datetime
from typing import List, Optional

from ninja import Schema
from pydantic import Field


class FinanceAccountSchema(Schema):
    startingBalance: float = Field(alias="starting_balance")
    currentBalance: float = Field(alias="current_balance")
    balanceAsOfDate: date = Field(alias="balance_as_of_date")
    createdAt: Optional[datetime] = Field(default=None, alias="created_at")

    class Config:
        populate_by_name = True


class CategorySchema(Schema):
    id: Optional[int] = None
    name: str
    type: str
    color: str


class RecurringBillSchema(Schema):
    id: Optional[int] = None
    name: str
    amount: float
    dueDay: int = Field(alias="due_day")
    category: Optional[CategorySchema] = None
    category_id: Optional[int] = None
    total: Optional[float] = None
    amountPaid: Optional[float] = Field(default=None, alias="amount_paid")

    class Config:
        populate_by_name = True


class PaycheckSchema(Schema):
    id: Optional[int] = None
    amount: float
    date: date
    frequency: str
    dayOfWeek: Optional[int] = Field(default=None, alias="day_of_week")
    dayOfMonth: Optional[int] = Field(default=None, alias="day_of_month")
    secondDayOfMonth: Optional[int] = Field(default=None, alias="second_day_of_month")
    category: Optional[CategorySchema] = None
    category_id: Optional[int] = None

    class Config:
        populate_by_name = True


class ExpenseSchema(Schema):
    id: Optional[int] = None
    name: str
    amount: float
    date: date
    category: Optional[CategorySchema] = None
    category_id: Optional[int] = None
    relatedBillId: Optional[int] = Field(default=None, alias="related_bill_id")

    class Config:
        populate_by_name = True


class FinanceDataSchema(Schema):
    account: FinanceAccountSchema
    recurringBills: List[RecurringBillSchema]
    paychecks: List[PaycheckSchema]
    expenses: List[ExpenseSchema]


class CalendarDataRequestSchema(Schema):
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    monthsToShow: int = 3


class MonthlySummaryRequestSchema(Schema):
    startDate: date
    monthsCount: int = 3


class ExportCSVRequestSchema(Schema):
    startDate: date
    endDate: date
    monthsToShow: int = 3


class BalanceProjectionRequestSchema(Schema):
    projectionMonths: int = 24


class CalendarBillSchema(Schema):
    id: int
    name: str
    amount: float
    dueDay: int
    category: Optional[CategorySchema]
    total: Optional[float] = None
    amountPaid: Optional[float] = None


class CalendarPaycheckSchema(Schema):
    id: int
    amount: float
    date: str
    frequency: str
    category: Optional[CategorySchema]


class CalendarExpenseSchema(Schema):
    id: int
    name: str
    amount: float
    date: str
    category: Optional[CategorySchema]
    relatedBillId: Optional[int] = None


class CalendarDaySchema(Schema):
    date: str
    isCurrentMonth: bool
    bills: List[CalendarBillSchema]
    paychecks: List[CalendarPaycheckSchema]
    expenses: List[CalendarExpenseSchema]
    runningBalance: float


class MonthlySummarySchema(Schema):
    month: str
    income: float
    bills: float
    expenses: float
    net: float


class FinanceAccountDataSchema(Schema):
    startingBalance: float
    currentBalance: float
    balanceAsOfDate: str


class FinanceDashboardDataSchema(Schema):
    account: FinanceAccountDataSchema
    expenses: List[CalendarExpenseSchema]
    paychecks: List[CalendarPaycheckSchema]
    recurringBills: List[CalendarBillSchema]


class CategoryChoicesSchema(Schema):
    colors: List[dict]
    types: List[dict]
