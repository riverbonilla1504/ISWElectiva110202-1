from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from .models import User
from .serializers import UserSerializer


SECRET_KEY = 'tomasin'

class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = make_password(request.data.get('password'))

        product = User.objects.create(name=name, email=email, password=password)
        serializer = UserSerializer(product)
        return Response(serializer.data, status=201)
