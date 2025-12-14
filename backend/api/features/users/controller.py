from typing import List

from asgiref.sync import sync_to_async
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from ninja import File
from ninja.files import UploadedFile
from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from .permissons import IsAdmin
from .schemas import (
    ProfileUpdateSchema,
    UserRegistrationSchema,
    UserSchema,
    UserUpdateSchema,
)

@api_controller("/users", auth=JWTAuth(), tags=["Users"])
class UserController:
    def _add_full_image_url(self, request, user):
        if hasattr(user, "profile") and user.profile.profile_image:
            user.profile._image_full_url = request.build_absolute_uri(
                user.profile.profile_image.url
            )
        return user

    @route.get("/me", response=UserSchema)
    def get_current_user(self, request):
        return request.user

    @route.patch("/me", response=UserSchema)
    def update_current_user(self, request, data: UserUpdateSchema):
        user = request.user
        for attr, value in data.dict(exclude_unset=True).items():
            setattr(user, attr, value)
        user.save()

        return request.user

    @route.patch("/me/profile", response={200: UserSchema, 400: dict})
    async def update_current_user_profile(self, request, data: ProfileUpdateSchema):
        user = request.user
        profile = await sync_to_async(lambda: user.profile)()

        data_dict = data.dict(exclude_unset=True)

        for attr, value in data_dict.items():
            setattr(profile, attr, value)

        await sync_to_async(profile.save)()

        return 200, request.user

    @route.post("/me/profile/image", response=UserSchema)
    def update_profile_image(self, request, profile_image: UploadedFile = File(...)):  # type: ignore
        user = request.user
        profile = user.profile

        if profile.profile_image:
            profile.profile_image.delete(save=False)

        profile.profile_image = profile_image
        profile.save()

        return request.user

    @route.get("/", response=List[UserSchema], permissions=[IsAdmin])
    def list_users(self, request):
        return User.objects.all()

    @route.get("/{user_id}", response=UserSchema, permissions=[IsAdmin])
    def get_user(self, request, user_id: int):
        return User.objects.get(id=user_id)


@api_controller("/auth", tags=["Auth"])
class AuthController:
    @route.post("/register", response={201: UserSchema, 400: dict})
    def register_user(self, request, data: UserRegistrationSchema):
        """Public endpoint for user registration"""
        if User.objects.filter(username=data.username).exists():
            return 400, {"detail": "Username already exists"}

        if User.objects.filter(email=data.email).exists():
            return 400, {"detail": "Email already exists"}

        user = User.objects.create(
            username=data.username,
            email=data.email,
            password=make_password(data.password),
            first_name=data.first_name or "",
            last_name=data.last_name or "",
        )

        return 201, user
