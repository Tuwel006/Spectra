import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import type { Cart } from './cart.service';
import type { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(): Cart {
    return this.cartService.getCart();
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  addItem(@Body() dto: AddToCartDto): Cart {
    return this.cartService.addItem(dto);
  }

  @Delete('items/:productId')
  removeItem(@Param('productId') productId: string): Cart {
    return this.cartService.removeItem(productId);
  }
}