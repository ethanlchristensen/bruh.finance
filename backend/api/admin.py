from django.contrib import admin

from api.features.users.models import Profile
from api.features.finance.models import FinanceAccount, RecurringBill, Expense, Paycheck

admin.site.register(Profile)
admin.site.register(FinanceAccount)
admin.site.register(RecurringBill)
admin.site.register(Expense)
admin.site.register(Paycheck)
