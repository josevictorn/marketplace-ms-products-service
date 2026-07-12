import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'name must not be empty' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'description must not be empty' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'price must be a number with up to 2 decimal places' },
  )
  @Min(0.01, { message: 'price must not be less than 0.01' })
  price: number;

  @IsInt({ message: 'stock must be an integer' })
  @Min(0, { message: 'stock must not be less than 0' })
  stock: number;
}
