import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Req() req: any, @Body() createProductDto: CreateProductDto) {
    const user = req.user as { id: string; email: string; role: string };

    if (user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can create products');
    }

    return this.productsService.create(createProductDto, user.id);
  }

  @Public()
  @Get()
  async findAllActive() {
    return this.productsService.findAllActive();
  }

  @Public()
  @Get('seller/:sellerId')
  async findAllActiveBySeller(@Param('sellerId') sellerId: string) {
    return this.productsService.findAllActiveBySeller(sellerId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
