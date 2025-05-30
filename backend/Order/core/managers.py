from django.db import models
from django.db.models import Q

class OrderManager(models.Manager):
    def create_order(self, user_id, product_id, quantity=1):
        # Check if user has an existing cart
        cart_order = self.filter(id_user=user_id, order_status='CARRITO').first()
        
        if cart_order:
            # Add product to existing cart
            order_product = cart_order.orders_products_set.filter(id_product=product_id).first()
            if order_product:
                # If product already in cart, increment quantity
                order_product.quantity = order_product.quantity + quantity
                order_product.save()
            else:
                # If product not in cart, create new order_product
                cart_order.orders_products_set.create(id_product=product_id, quantity=quantity)
            
            # Recalculate total price
            self.calculate_price(cart_order.id_order)
            return cart_order
        else:
            # Create new cart order
            order = self.create(
                id_user=user_id,
                total_price=0,
                order_status='CARRITO'
            )
            # Add product to new cart
            order.orders_products_set.create(id_product=product_id, quantity=quantity)
            # Calculate initial price
            self.calculate_price(order.id_order)
            return order

    def calculate_price(self, order_id):
        order = self.get(id_order=order_id)
        # Here you would typically get product prices from the Product service
        # For now, we'll assume each product costs 100 (this should be updated)
        total = sum(100 * op.quantity for op in order.orders_products_set.all())
        order.total_price = total
        order.save()
        return order

    def update_status_to_pending(self, order_id):
        order = self.get(id_order=order_id)
        order.order_status = 'PENDING'
        order.save()
        return order

    def update_status_to_onway(self, order_id):
        order = self.get(id_order=order_id)
        order.order_status = 'ONWAY'
        order.save()
        return order

    def update_status_to_delivered(self, order_id):
        order = self.get(id_order=order_id)
        order.order_status = 'DELIVERED'
        order.save()
        return order

    def update_status_to_confirmed(self, order_id):
        order = self.get(id_order=order_id)
        order.order_status = 'CONFIRMED'
        order.save()
        return order

    def add_product(self, order_id, product_id, quantity=1):
        order = self.get(id_order=order_id)
        order_product = order.orders_products_set.filter(id_product=product_id).first()
        
        if order_product:
            order_product.quantity = order_product.quantity + quantity
            order_product.save()
        else:
            order.orders_products_set.create(id_product=product_id, quantity=quantity)
        
        self.calculate_price(order_id)
        return order

    def delete_product(self, order_id, product_id):
        order = self.get(id_order=order_id)
        order.orders_products_set.filter(id_product=product_id).delete()
        self.calculate_price(order_id)
        return order

    def get_all_products_byuserid(self, user_id):
        return self.filter(id_user=user_id).prefetch_related('orders_products_set')

    def get_order_byid(self, order_id):
        return self.get(id_order=order_id)

    def get_delivered_orders_byuserid(self, user_id):
        return self.filter(id_user=user_id, order_status='DELIVERED')

    def pay_order(self, order_id):
        # This will be implemented later
        pass

class OrderProductManager(models.Manager):
    pass
    