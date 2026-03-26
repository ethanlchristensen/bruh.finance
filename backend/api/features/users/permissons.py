from django.http import HttpRequest
from ninja_extra import ControllerBase
from ninja_extra.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request: HttpRequest, controller: ControllerBase) -> bool:
        return request.user.is_authenticated and request.user.is_staff


class IsApproved(BasePermission):
    def has_permission(self, request: HttpRequest, controller: ControllerBase) -> bool:
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.status == "APPROVED"
        )


class IsSuperUser(BasePermission):
    def has_permission(self, request: HttpRequest, controller: ControllerBase) -> bool:
        return request.user.is_authenticated and request.user.is_superuser
