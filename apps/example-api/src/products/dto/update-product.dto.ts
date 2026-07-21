import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto implements Partial<CreateProductDto> {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
}
