import json
from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from core.models import orders, orders_products
from django.contrib.auth.hashers import make_password
import jwt
from datetime import datetime, timedelta

SECRET_KEY = 'tomasin'

class OrderApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create test user ID (assuming user service handles actual user)
        cls.user_id = 1
        cls.other_user_id = 2

    def setUp(self):
        # Create a token for authentication
        self.token = jwt.encode({
            'id': self.user_id,
            'exp': datetime.utcnow() + timedelta(minutes=20),
            'iat': datetime.utcnow()
        }, SECRET_KEY, algorithm='HS256')
        
        self.headers = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}

    def test_create_order(self):
        """Test creating a new order (cart)"""
        url = reverse('create_order')
        data = {
            'product_id': 1,
            'quantity': 2
        }
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['order_status'], 'CARRITO')
        self.assertEqual(response.json()['id_user'], self.user_id)
        self.assertEqual(len(response.json()['products']), 1)
        self.assertEqual(response.json()['products'][0]['quantity'], 2)

    def test_get_cart(self):
        """Test getting cart contents"""
        # First create an order in cart status
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )
        orders_products.objects.create(
            id_order=order,
            id_product=1,
            quantity=2
        )

        url = reverse('get_cart')
        response = self.client.get(url, **self.headers)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['id_order'], order.id_order)
        self.assertEqual(len(response.json()['products']), 1)

    def test_add_product_to_order(self):
        """Test adding a product to an existing order"""
        # Create initial order
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )

        url = reverse('add_product_to_order', args=[order.id_order])
        data = {
            'product_id': 2,
            'quantity': 3
        }
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json',
            **self.headers
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['products']), 1)
        self.assertEqual(response.json()['products'][0]['quantity'], 3)

    def test_delete_product_from_order(self):
        """Test removing a product from an order"""
        # Create order with a product
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )
        order_product = orders_products.objects.create(
            id_order=order,
            id_product=1,
            quantity=2
        )

        url = reverse('delete_product_from_order', args=[order.id_order, order_product.id_product])
        response = self.client.delete(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['products']), 0)

    def test_update_order_status(self):
        """Test updating order status"""
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )

        url = reverse('update_order_status', kwargs={'order_id': order.id_order, 'status_name': 'pending'})
        response = self.client.put(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['order_status'], 'PENDING')

    def test_get_user_orders(self):
        """Test getting all user orders"""
        # Create multiple orders for user
        orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )
        orders.objects.create(
            id_user=self.user_id,
            total_price=200,
            order_status='DELIVERED'
        )

        url = reverse('get_user_orders')
        response = self.client.get(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

    def test_get_delivered_orders(self):
        """Test getting delivered orders"""
        # Create orders with different statuses
        orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )
        orders.objects.create(
            id_user=self.user_id,
            total_price=200,
            order_status='DELIVERED'
        )

        url = reverse('get_delivered_orders')
        response = self.client.get(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['order_status'], 'DELIVERED')

    def test_get_order_by_id(self):
        """Test getting specific order by ID"""
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )

        url = reverse('get_order_by_id', args=[order.id_order])
        response = self.client.get(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['id_order'], order.id_order)

    def test_unauthorized_access(self):
        """Test unauthorized access to other user's order"""
        # Create order for other user
        order = orders.objects.create(
            id_user=self.other_user_id,
            total_price=100,
            order_status='CARRITO'
        )

        url = reverse('get_order_by_id', args=[order.id_order])
        response = self.client.get(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_to_existing_cart(self):
        """Test adding product to existing cart increases quantity"""
        # Create initial order with product
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )
        orders_products.objects.create(
            id_order=order,
            id_product=1,
            quantity=1
        )

        # Add same product again
        url = reverse('create_order')
        data = {
            'product_id': 1,
            'quantity': 1
        }
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json',
            **self.headers
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['products'][0]['quantity'], 2)

    def test_invalid_order_status_update(self):
        """Test updating order status with invalid status"""
        order = orders.objects.create(
            id_user=self.user_id,
            total_price=100,
            order_status='CARRITO'
        )

        url = reverse('update_order_status', kwargs={'order_id': order.id_order, 'status_name': 'invalid_status'})
        response = self.client.put(url, **self.headers)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
