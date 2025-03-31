from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

class AllProductsView(APIView):
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class CreateProductView(APIView):
    def post(self, request):
        name = request.data.get('name')
        description = request.data.get('description')
        price = request.data.get('price')
        picture = request.data.get('picture')
        product = Product.objects.create(name=name, description=description, price=price, picture=picture)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=201)

class DeleteProductView(APIView):
    def delete(self, request, product_id):
        try:
            product = Product.objects.delete_product(product_id)
            return Response( {"deleted product with id ": f"{product_id}"}, status=200)
        except Product.DoesNotExist:
            return Response({"error": "Product not Found"}, status=404)

class ChangeProductAvailabilityView(APIView):
    def patch(self, request, product_id):
        try:
            product = Product.objects.change_availability(product_id) 
            serializer = ProductSerializer(product)
            return Response(serializer.data, status=200)
        except Product.DoesNotExist:
            return Response({"error": "Product not Found"}, status=404)