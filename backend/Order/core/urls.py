from django.urls import path
from .views import (
    CreateOrderView,
    AddProductToOrderView,
    DeleteProductFromOrderView,
    UpdateOrderStatusView,
    GetUserOrdersView,
    GetOrderByIdView,
    GetDeliveredOrdersView,
    GetCartOrderView,
)

urlpatterns = [
    # Create new order/add to cart
    path('create/', CreateOrderView.as_view(), name='create_order'),
    
    # Cart endpoint
    path('cart/', GetCartOrderView.as_view(), name='get_cart'),
    
    # Add/remove products from order
    path('<int:order_id>/add-product/', AddProductToOrderView.as_view(), name='add_product_to_order'),
    path('<int:order_id>/delete-product/<int:product_id>/', DeleteProductFromOrderView.as_view(), name='delete_product_from_order'),
    
    # Update order status
    path('<int:order_id>/status/<str:status_name>/', UpdateOrderStatusView.as_view(), name='update_order_status'),
    
    # Get orders
    path('user/orders/', GetUserOrdersView.as_view(), name='get_user_orders'),
    path('user/orders/delivered/', GetDeliveredOrdersView.as_view(), name='get_delivered_orders'),
    path('<int:order_id>/', GetOrderByIdView.as_view(), name='get_order_by_id'),
]

