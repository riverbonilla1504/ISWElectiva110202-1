from django.db import models

class ProductManager(models.Manager):
    def get_all_products(self):
        return self.filter(state=True)

    def create_product(self, name, description, price, picture):
        product = self.create(name=name, description=description, price=price, picture=picture)
        return product

    def delete_product(self, product_id):
        product = self.get(id_product=product_id)
        product.delete()
        return product
    
    def change_availability(self, product_id):
        product = self.get(id_product=product_id)
        product.state = False
        product.save()
        return product