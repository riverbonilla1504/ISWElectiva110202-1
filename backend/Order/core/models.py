from django.db import models
from core.managers import OrderManager, OrderProductManager

class orders(models.Model):
    ORDER_STATUS_CHOICES = [
        ('CARRITO', 'En Carrito'),
        ('PENDING', 'Pendiente'),
        ('ONWAY', 'En Camino'),
        ('DELIVERED', 'Entregado'),
        ('CONFIRMED', 'Confirmado'),
    ]

    id_order = models.AutoField(primary_key=True)
    id_user = models.IntegerField()
    total_price = models.IntegerField()
    order_status = models.CharField(max_length=100, choices=ORDER_STATUS_CHOICES, default='CARRITO')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = OrderManager()

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

class orders_products(models.Model):
    id_order_product = models.AutoField(primary_key=True)
    id_order = models.ForeignKey(orders, on_delete=models.CASCADE)
    id_product = models.IntegerField()
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = OrderProductManager()

    class Meta:
        db_table = 'orders_products'
        unique_together = ('id_order', 'id_product')

