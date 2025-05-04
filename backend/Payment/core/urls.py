from django.urls import path

from core.views import getCardsView, addCardView, deleteCardView

urlpatterns = [
    path('getall/<int:id_user>/', getCardsView.as_view(), name='get_cards'),
    path('add/', addCardView.as_view(), name='add_card'),
    path('delete/<int:id_user>/', deleteCardView.as_view(), name='delete_card'),
]