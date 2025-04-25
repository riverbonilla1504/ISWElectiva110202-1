from django.db import models
from core.managers import UserManager


class User(models.Model):
    id_user = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, unique=True)
    instagram = models.BooleanField(default=False)
    twitter = models.BooleanField(default=False)
    google = models.BooleanField(default=False)
    profile_picture = models.TextField()
    role = models.CharField(max_length=10, default='user')

    objects = UserManager()