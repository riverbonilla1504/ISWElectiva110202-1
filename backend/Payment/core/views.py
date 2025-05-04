from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from .models import cards
from .serializers import CardsSerializer
import jwt


SECRET_KEY = 'tomasin'


# expect the token in the header as Authorization and id_user in the url
#returns all cards of the user
class getCardsView(APIView):
    def get(self, request, id_user):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            raise AuthenticationFailed('Token no proporcionado')
        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')
        if payload['id'] != id_user:
            raise AuthenticationFailed('No autorizado')

        try:
            user_cards = cards.objects.get_cards_by_user(payload['id'])
            serializer = CardsSerializer(user_cards, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class addCardView(APIView):
    def post(self, request):
        id_user = request.data.get('id_user')
        cardholder_name = request.data.get('cardholder_name')
        card_number = request.data.get('card_number')
        exp_date = request.data.get('exp_date')

        if not id_user or not cardholder_name or not card_number or not exp_date:
            return Response({"error": "All fields are required"}, status=400)

        try:
            card = cards.objects.add_card(id_user, cardholder_name, card_number, exp_date)
            return Response({"message": "Card added successfully", "card": card.id_card}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

# expect the token in the header as Authorization and id_user in the url and id_card in the body
#delete the card with the id_card
class deleteCardView(APIView):
    def delete(self, request, id_user):
        id_card = request.data.get('id_card')
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            raise AuthenticationFailed('Token no proporcionado')
        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido')
        if payload['id'] != id_user:
            raise AuthenticationFailed('No autorizado')

        try:
            card = cards.objects.get_card(id_card)
            if card.id_user != payload['id']:
                raise AuthenticationFailed('No autorizado, id_user no coincide')
            cards.objects.delete_card(id_card)
            return Response({"message": "Card deleted successfully"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
