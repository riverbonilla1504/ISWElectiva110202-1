from django.urls import path

from core.views import AllProductsView, CreateProductView, DeleteProductView, ChangeProductAvailabilityView

urlpatterns = [
    path('', AllProductsView.as_view(), name='all_products'),
    path('', CreateProductView.as_view(), name='create_product'),
    path('<int:product_id>', DeleteProductView.as_view(), name='delete_product'),
    path('change_availability/<int:product_id>', ChangeProductAvailabilityView.as_view(), name='change_product_availability'),
]
