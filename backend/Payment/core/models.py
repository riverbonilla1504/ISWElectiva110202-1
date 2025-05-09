from django.db import models
from core.managers import CardsManager


class cards(models.Model):
    id_card = models.AutoField(primary_key=True)
    id_user = models.IntegerField()
    cardholder_name = models.CharField(max_length=100)
    card_number = models.CharField(max_length=16, unique=True)
    exp_date = models.DateField()
    objects = CardsManager()