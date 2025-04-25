from django.db import models

class UserManager(models.Manager):
    def create_user(self, name, email, password):
        user = self.create(name=name, email=self.normalize_email(email), password=password,)
        return user
