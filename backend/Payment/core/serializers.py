from rest_framework import serializers

from .models import cards


class CardsSerializer(serializers.ModelSerializer):
    class Meta:
        model = cards
        fields = '__all__'

