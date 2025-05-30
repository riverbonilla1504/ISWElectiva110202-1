from rest_framework import serializers
from .models import orders, orders_products


class OrderProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = orders_products
        fields = ['id_order_product', 'id_product', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    products = OrderProductSerializer(source='orders_products_set', many=True, read_only=True)

    class Meta:
        model = orders
        fields = ['id_order', 'id_user', 'total_price', 'order_status', 'created_at', 'updated_at', 'products']

