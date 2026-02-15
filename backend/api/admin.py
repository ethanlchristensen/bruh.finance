from django.contrib import admin

from api.features.finance.models import Category, Expense, FinanceAccount, Paycheck, RecurringBill
from api.features.users.models import Profile

admin.site.register(Profile)
admin.site.register(FinanceAccount)
admin.site.register(RecurringBill)
admin.site.register(Expense)
admin.site.register(Paycheck)
admin.site.register(Category)
