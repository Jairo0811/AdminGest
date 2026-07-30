import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { OperationsService } from './operations.service';

@ApiTags('Operaciones administrativas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('catalog')
  listCatalog(@CurrentUser() user: AuthUser) {
    return this.operations.listCatalog(user.companyId);
  }

  @Post('catalog')
  createCatalogItem(@CurrentUser() user: AuthUser, @Body() dto: CreateCatalogItemDto) {
    return this.operations.createCatalogItem(user, dto);
  }

  @Post('catalog/:id/movements')
  moveStock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.operations.moveStock(user, id, dto);
  }

  @Get('suppliers')
  listSuppliers(@CurrentUser() user: AuthUser) {
    return this.operations.listSuppliers(user.companyId);
  }

  @Post('suppliers')
  createSupplier(@CurrentUser() user: AuthUser, @Body() dto: CreateSupplierDto) {
    return this.operations.createSupplier(user, dto);
  }

  @Get('expenses')
  listExpenses(@CurrentUser() user: AuthUser) {
    return this.operations.listExpenses(user.companyId);
  }

  @Post('expenses')
  createExpense(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.operations.createExpense(user, dto);
  }

  @Get('purchase-orders')
  listPurchaseOrders(@CurrentUser() user: AuthUser) {
    return this.operations.listPurchaseOrders(user.companyId);
  }

  @Post('purchase-orders')
  createPurchaseOrder(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.operations.createPurchaseOrder(user, dto);
  }

  @Post('purchase-orders/:id/receive')
  receivePurchaseOrder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.operations.receivePurchaseOrder(user, id);
  }
}
