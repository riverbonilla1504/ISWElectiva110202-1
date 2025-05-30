from django.urls import path
from .views import (
    GetUserOrdersView,
    GetOrderByIdView,
    GetDeliveredOrdersView,
    GetCartOrderView,
)

urlpatterns = [
    # Cart endpoint
    path('cart/', GetCartOrderView.as_view(), name='get_cart'),
    
    # Get orders
    path('user/orders/', GetUserOrdersView.as_view(), name='get_user_orders'),
    path('user/orders/delivered/', GetDeliveredOrdersView.as_view(), name='get_delivered_orders'),
    path('<int:order_id>/', GetOrderByIdView.as_view(), name='get_order_by_id'),
]

