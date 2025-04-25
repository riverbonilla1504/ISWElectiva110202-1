from django.test import TestCase
from core.models import Product


class ProductManagerTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        
        cls.product_1 = Product.objects.create(
            name="Product 1",
            description="Description 1",
            price=10.0,
            picture="image1.jpg",
            state=True
        )
        cls.product_2 = Product.objects.create(
            name="Product 2",
            description="Description 2",
            price=20.0,
            picture="image2.jpg",
            state=False
        )

    def test_get_all_products(self):
        
        products = Product.objects.get_all_products()
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0].name, "Product 1")
    
    def test_create_product(self):
        
        product = Product.objects.create_product(
            name="New Product",
            description="New Description",
            price=30.0,
            picture="new_image.jpg"
        )
        self.assertEqual(Product.objects.count(), 3)
        self.assertEqual(product.name, "New Product")
        self.assertEqual(product.description, "New Description")
        self.assertEqual(product.price, 30.0)
        self.assertEqual(product.picture, "new_image.jpg")
    
    def test_delete_product(self):
        
        initial_count = Product.objects.count()
        deleted_product = Product.objects.delete_product(self.product_1.id_product)
        self.assertEqual(Product.objects.count(), initial_count - 1)
        self.assertEqual(deleted_product.name, "Product 1")

    def test_change_availability(self):
        
        updated_product = Product.objects.change_availability(self.product_1.id_product)
        self.assertFalse(updated_product.state)
        self.assertEqual(updated_product.name, "Product 1")
