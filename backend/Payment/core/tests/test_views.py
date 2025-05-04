import json
from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from core.models import User
from django.contrib.auth.hashers import make_password
import jwt
from datetime import datetime, timedelta

SECRET_KEY = 'tomasin'

class UsuarioApiTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create(
            name='Test User',
            email='test@example.com',
            password=make_password('securepassword123')
        )

    def test_register_user(self):
        url = reverse('register')
        data = {
            'name': 'New User',
            'email': 'new@example.com',
            'password': 'newpassword'
        }
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['email'], data['email'])

    def test_login_user_success(self):
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.json())

    def test_login_user_invalid_credentials(self):
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_edit_user_success(self):
        token = jwt.encode({
            'id': self.user.id_user,
            'exp': datetime.utcnow() + timedelta(minutes=20),
            'iat': datetime.utcnow()
        }, SECRET_KEY, algorithm='HS256')

        url = reverse('edit_user', args=[self.user.id_user])
        data = {'name': 'Updated Name'}
        response = self.client.put(
            url,
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], 'Updated Name')

    def test_edit_user_invalid_token(self):
        url = reverse('edit_user', args=[self.user.id_user])
        data = {'name': 'Intento Fallido'}
        response = self.client.put(
            url,
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer invalidtoken'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
