import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    {
      id: '1',
      name: 'Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones',
      price: 199.99,
      stock: 50,
      category: 'Electronics',
    },
    {
      id: '2',
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with red switches',
      price: 89.99,
      stock: 30,
      category: 'Electronics',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: string): Product {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  create(dto: CreateProductDto): Product {
    const newProduct: Product = {
      id: String(this.products.length + 1),
      ...dto,
    };
    this.products.push(newProduct);
    return newProduct;
  }

  update(id: string, dto: UpdateProductDto): Product {
    const product = this.findOne(id);
    const updated = { ...product, ...dto };
    this.products = this.products.map(p => (p.id === id ? updated : p));
    return updated;
  }

  remove(id: string): void {
    this.findOne(id);
    this.products = this.products.filter(p => p.id !== id);
  }
}
