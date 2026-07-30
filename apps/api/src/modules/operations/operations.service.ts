import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listCatalog(companyId: string) {
    return this.prisma.catalogItem.findMany({
      where: { companyId, isActive: true },
      include: { stockMovements: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' },
    });
  }

  async createCatalogItem(user: AuthUser, dto: CreateCatalogItemDto) {
    const { initialStock = 0, ...data } = dto;
    const item = await this.prisma.catalogItem.create({
      data: {
        companyId: user.companyId,
        ...data,
        sku: data.sku?.trim() || null,
        unitCost: data.unitCost ?? 0,
        taxRate: data.taxRate ?? 18,
        reorderPoint: data.reorderPoint ?? 0,
        stockQuantity: data.type === 'PRODUCT' ? initialStock : 0,
        stockMovements:
          data.type === 'PRODUCT' && initialStock > 0
            ? {
                create: {
                  type: 'IN',
                  quantity: initialStock,
                  reference: 'INVENTARIO-INICIAL',
                },
              }
            : undefined,
      },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'CatalogItem',
      entityId: item.id,
      newValues: item,
    });
    return item;
  }

  async moveStock(user: AuthUser, id: string, dto: CreateStockMovementDto) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, companyId: user.companyId, isActive: true },
    });
    if (!item || item.type !== 'PRODUCT') {
      throw new NotFoundException('Producto de inventario no encontrado.');
    }
    const current = Number(item.stockQuantity);
    const next =
      dto.type === 'ADJUSTMENT'
        ? dto.quantity
        : dto.type === 'IN'
          ? current + dto.quantity
          : current - dto.quantity;
    if (next < 0) throw new ConflictException('El movimiento dejaría inventario negativo.');

    const delta = dto.type === 'ADJUSTMENT' ? next - current : dto.type === 'IN' ? dto.quantity : -dto.quantity;
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.catalogItem.update({
        where: { id },
        data: { stockQuantity: next },
      });
      await transaction.inventoryMovement.create({
        data: {
          catalogItemId: id,
          type: dto.type,
          quantity: delta,
          reference: dto.reference,
          notes: dto.notes,
        },
      });
      return updated;
    });
  }

  listSuppliers(companyId: string) {
    return this.prisma.supplier.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  createSupplier(user: AuthUser, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: { companyId: user.companyId, ...dto, email: dto.email?.toLowerCase() },
    });
  }

  listExpenses(companyId: string) {
    return this.prisma.expense.findMany({
      where: { companyId },
      orderBy: { expenseDate: 'desc' },
      take: 200,
    });
  }

  createExpense(user: AuthUser, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { companyId: user.companyId, ...dto },
    });
  }

  listPurchaseOrders(companyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { supplier: true, items: true },
      orderBy: { orderDate: 'desc' },
    });
  }

  async createPurchaseOrder(user: AuthUser, dto: CreatePurchaseOrderDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId: user.companyId, isActive: true },
    });
    if (!supplier) throw new BadRequestException('El proveedor indicado no es válido.');
    const catalogIds = dto.items.flatMap((item) => (item.catalogItemId ? [item.catalogItemId] : []));
    if (catalogIds.length) {
      const validCount = await this.prisma.catalogItem.count({
        where: { id: { in: catalogIds }, companyId: user.companyId, isActive: true },
      });
      if (validCount !== new Set(catalogIds).size) {
        throw new BadRequestException('Uno de los productos indicados no es válido.');
      }
    }
    const items = dto.items.map((item) => {
      const taxRate = item.taxRate ?? 18;
      const base = item.quantity * item.unitCost;
      return { ...item, taxRate, lineTotal: base + base * (taxRate / 100) };
    });
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const tax = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost * (item.taxRate / 100),
      0,
    );
    const order = await this.prisma.purchaseOrder.create({
      data: {
        companyId: user.companyId,
        supplierId: dto.supplierId,
        number: `OC-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
        expectedAt: dto.expectedAt,
        notes: dto.notes,
        subtotal,
        tax,
        total: subtotal + tax,
        items: { create: items },
      },
      include: { supplier: true, items: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: order.id,
      newValues: order,
    });
    return order;
  }

  async receivePurchaseOrder(user: AuthUser, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId: user.companyId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada.');
    if (order.status === 'RECEIVED') {
      throw new ConflictException('La orden ya fue recibida.');
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const item of order.items) {
        if (!item.catalogItemId) continue;
        await transaction.catalogItem.update({
          where: { id: item.catalogItemId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await transaction.inventoryMovement.create({
          data: {
            catalogItemId: item.catalogItemId,
            type: 'IN',
            quantity: item.quantity,
            reference: order.number,
          },
        });
      }
      await transaction.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });
    });
    return { success: true };
  }
}
