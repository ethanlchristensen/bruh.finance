from django.contrib import admin

from .features.users.models import Profile

admin.site.register(Profile)
