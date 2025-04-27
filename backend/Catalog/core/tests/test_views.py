import json
from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from core.models import Product


class ProductApiTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.product = Product.objects.create(
            id_product=1,
            name="Test Product",
            description="Test Description",
            price=100.0,
            picture="test_image.jpg"
        )

    def test_all_products(self):
        url = reverse('all_products')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1) 

    def test_create_product(self):
        url = reverse('create_product')
        data = {
            'id_product': 2,
            'name': 'New Product',
            'description': 'New Product Description',
            'price': 150.0,
            'picture': 'new_image.jpg'
        }
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['name'], data['name'])
        self.assertEqual(response.json()['description'], data['description'])

    def test_delete_product_success(self):
        url = reverse('delete_product', args=[self.product.id_product])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(f"deleted product with id {self.product.id_product}", response.json())

    def test_delete_product_not_found(self):
        url = reverse('delete_product', args=[99999]) 
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Product not Found", response.json()['error'])

    def test_change_product_availability_success(self):
        url = reverse('change_product_availability', args=[self.product.id_product])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('name', response.json())  
    def test_change_product_availability_not_found(self):
        url = reverse('change_product_availability', args=[99999]) 
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Product not Found", response.json()['error'])
