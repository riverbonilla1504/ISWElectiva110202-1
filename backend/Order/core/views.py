from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.hashers import make_password, check_password
from .models import orders, orders_products
from .serializers import OrderSerializer
import datetime
import jwt

SECRET_KEY = 'tomasin'

def verify_token(request):
    token = request.headers.get('Authorization', '').split(' ')[1] if 'Authorization' in request.headers else None
    if not token:
        raise AuthenticationFailed('No token provided')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token expired')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token')


class GetCartOrderView(APIView):
    def get(self, request):
        payload = verify_token(request)
        cart_order = orders.objects.filter(
            id_user=payload['id'],
            order_status='CARRITO'
        ).first()
        
        if not cart_order:
            return Response({'message': 'No hay productos en el carrito'}, status=status.HTTP_200_OK)
            
        return Response(OrderSerializer(cart_order).data)


class GetUserOrdersView(APIView):
    def get(self, request):
        payload = verify_token(request)
        orders_list = orders.objects.get_all_products_byuserid(payload['id'])
        return Response(OrderSerializer(orders_list, many=True).data)

class GetOrderByIdView(APIView):
    def get(self, request, order_id):
        payload = verify_token(request)
        order = get_object_or_404(orders, id_order=order_id)
        
        if order.id_user != payload['id']:
            raise AuthenticationFailed('Not authorized to view this order')

        return Response(OrderSerializer(order).data)

class GetDeliveredOrdersView(APIView):
    def get(self, request):
        payload = verify_token(request)
        delivered_orders = orders.objects.get_delivered_orders_byuserid(payload['id'])
        return Response(OrderSerializer(delivered_orders, many=True).data)

