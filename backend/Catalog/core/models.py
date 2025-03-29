from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

from core.managers import ProductManager


class Product(models.Model):
    id_product = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    state = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, validators=[ MaxValueValidator(1.00), MinValueValidator(0.00)])
    picture = models.TextField()
    objects = ProductManager()