from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    """
    groups = models.ManyToManyField(
    'auth.Group',
    related_name='custom_user_set',
    blank=True,
    related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        related_query_name='user',
    )
