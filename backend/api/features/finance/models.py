from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class FinanceAccount(SoftDeleteModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="finance_account")
    starting_balance = models.DecimalField(max_digits=10, decimal_places=2)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2)
    balance_as_of_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Finance Account"


TAILWIND_BG_COLOR_CHOICES = [
    ("red-500", "Red"),
    ("rose-500", "Rose"),
    ("orange-500", "Orange"),
    ("amber-500", "Amber"),
    ("yellow-500", "Yellow"),
    ("lime-500", "Lime"),
    ("green-500", "Green"),
    ("emerald-500", "Emerald"),
    ("teal-500", "Teal"),
    ("cyan-500", "Cyan"),
    ("sky-500", "Sky"),
    ("blue-500", "Blue"),
    ("indigo-500", "Indigo"),
    ("violet-500", "Violet"),
    ("purple-500", "Purple"),
    ("fuchsia-500", "Fuchsia"),
    ("pink-500", "Pink"),
    ("gray-500", "Gray"),
]

CATEGORY_TYPE_CHOICES = [
    ("income", "Income"),
    ("expense", "Expense"),
    ("bill", "Bill"),
    ("general", "General"),
]


class Category(SoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    type = models.CharField(
        max_length=10,
        choices=CATEGORY_TYPE_CHOICES,
        default="general",
        help_text="Defines if this category is typically for income, expenses, or bills.",
    )
    color = models.CharField(
        max_length=15,
        choices=TAILWIND_BG_COLOR_CHOICES,
        default="bg-gray-500",
        help_text="Tailwind CSS background color class for this category.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "name")
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.user.username}'s {self.name} ({self.get_type_display()})"


class RecurringBill(SoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recurring_bills")
    finance_account = models.ForeignKey(
        FinanceAccount,
        on_delete=models.CASCADE,
        related_name="recurring_bills",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_day = models.IntegerField()
    # Now links to the Category model
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurring_bills",
        limit_choices_to={"type__in": ["bill", "expense", "general"]},
        help_text="The category this recurring bill belongs to.",
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s {self.name}"


class Paycheck(SoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paychecks")
    finance_account = models.ForeignKey(
        FinanceAccount, on_delete=models.CASCADE, related_name="paychecks", null=True, blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    frequency = models.CharField(max_length=255)
    day_of_week = models.IntegerField(null=True, blank=True)
    day_of_month = models.IntegerField(null=True, blank=True)
    second_day_of_month = models.IntegerField(null=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="paychecks",
        limit_choices_to={"type__in": ["income", "general"]},
        help_text="The category this paycheck belongs to (e.g., Salary, Freelance).",
    )

    def __str__(self):
        return f"{self.user.username}'s Paycheck on {self.date}"


class Expense(SoftDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="expenses")
    finance_account = models.ForeignKey(
        FinanceAccount, on_delete=models.CASCADE, related_name="expenses", null=True, blank=True
    )
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
        limit_choices_to={"type__in": ["expense", "general"]},
        help_text="The category this expense belongs to.",
    )
    related_bill = models.ForeignKey(
        RecurringBill, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses"
    )

    def __str__(self):
        return f"{self.user.username}'s {self.name} on {self.date}"
