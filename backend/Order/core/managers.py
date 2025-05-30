from django.db import models
from django.db.models import Q

class OrderManager(models.Manager):

    def calculate_price(self, order_id):
        order = self.get(id_order=order_id)
        # Here you would typically get product prices from the Product service
        # For now, we'll assume each product costs 100 (this should be updated)
        total = sum(100 * op.quantity for op in order.orders_products_set.all())
        order.total_price = total
        order.save()
        return order

    def get_all_products_byuserid(self, user_id):
        return self.filter(id_user=user_id).prefetch_related('orders_products_set')

    def get_order_byid(self, order_id):
        return self.get(id_order=order_id)

    def get_delivered_orders_byuserid(self, user_id):
        return self.filter(id_user=user_id, order_status='DELIVERED')


class OrderProductManager(models.Manager):
    pass
    