export interface OrderItemDto {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  userId: string;
  items: OrderItemDto[];
  shippingAddress: string;
}
