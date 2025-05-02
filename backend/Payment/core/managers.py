from django.db import models

class CardsManager(models.Manager):
    def add_card(self, id_user, cardholder_name, card_number, exp_date):
        card = self.create(id_user=id_user, cardholder_name=cardholder_name, card_number=card_number, exp_date=exp_date)
        return card
    def get_cards_by_user(self, id_user):
        return self.filter(id_user=id_user)
    def get_card(self, card_id):
        try:
            return self.get(id=card_id)
        except self.model.DoesNotExist:
            return None