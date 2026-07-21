import { Injectable } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
}

@Injectable()
export class CartService {
  private cart: Cart = {
    items: [],
    totalItems: 0,
  };

  getCart(): Cart {
    return this.cart;
  }

  addItem(dto: AddToCartDto): Cart {
    const existing = this.cart.items.find(i => i.productId === dto.productId);
    if (existing) {
      existing.quantity += dto.quantity;
    } else {
      this.cart.items.push({
        productId: dto.productId,
        quantity: dto.quantity,
      });
    }
    this.recalculateTotal();
    return this.cart;
  }

  removeItem(productId: string): Cart {
    this.cart.items = this.cart.items.filter(i => i.productId !== productId);
    this.recalculateTotal();
    return this.cart;
  }

  private recalculateTotal(): void {
    this.cart.totalItems = this.cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }
}
