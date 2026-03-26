from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    def __str__(self):
        return f"{self.user.username}'s profile ({self.status})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Create profile first
        profile = Profile.objects.create(user=instance)

        # Superusers and staff are approved by default
        if instance.is_superuser or instance.is_staff:
            profile.status = Profile.Status.APPROVED
            profile.save()
        else:
            # Regular users are pending and inactive
            instance.is_active = False
            instance.save()


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
