# Codebase Consistency Audit & Fix Plan

## Audit Result

After auditing all 34 files across 5 modules, the codebase is **well-structured (90%+ consistency)**. Six real issues found — no critical bugs, but pattern deviations and one correctness fix.

**Branch**: Create `chore/codebase-consistency` from current `feat/inventory-module`

---

## Step 1: Fix slug utility — missing Unicode/diacritics normalization

**Why**: `generateSlug("Café Latte")` produces `"caf-latte"` (é stripped) instead of `"cafe-latte"`. Unicode NFD normalization decomposes accented characters into base + combining mark, then we strip the marks.

**File**: `src/common/utils/slug.util.ts`

**Full code** (complete `generateSlug` function):

```typescript
export function generateSlug(text: string): string {
  return text
    .normalize('NFD')                    // Decompose: "é" → "e" + combining accent mark
    .replace(/[\u0300-\u036f]/g, '')     // Strip combining diacritical marks → "e"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')       // Remove special characters
    .replace(/\s+/g, '-')               // Replace spaces with hyphens
    .replace(/-+/g, '-')                // Collapse multiple hyphens
    .replace(/^-|-$/g, '');             // Remove leading/trailing hyphens
}
```

Also update JSDoc example from `// "caf-latte"` to `// "cafe-latte"`.

| Line/Block | What it does | Why we need it |
|---|---|---|
| `.normalize('NFD')` | Decomposes Unicode chars (é → e + ◌́) | So accented letters become base letter + separate mark |
| `.replace(/[\u0300-\u036f]/g, '')` | Removes combining diacritical marks | Strips the accent marks, leaving base ASCII letters |

**Commit**: `fix: add Unicode normalization to slug generation`

---

## Step 2: Fix seed file — placeholder password hashes

**Why**: Seed uses `'$2b$12$placeholder.hash...'` which is not a valid bcrypt hash. Seeded users can never log in. We should hash real passwords using the same bcrypt rounds (12) as the app.

**File**: `prisma/seed.ts`

**Full code** (complete file):

```typescript
import { PrismaClient, Role } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/config/env.validation';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 12; // Must match PASSWORD_BCRYPT_ROUNDS in users.service.ts

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Hash passwords with same rounds as the application
  const adminPassword = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  const customerPassword = await bcrypt.hash('Customer123!', BCRYPT_ROUNDS);

  // Create admin user (admin@example.com / Admin123!)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });

  // Create test customer (customer@example.com / Customer123!)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      role: Role.CUSTOMER,
    },
  });

  console.log('Seeded users:', { admin: admin.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
```

| Line/Block | What it does | Why we need it |
|---|---|---|
| `import * as bcrypt` | Imports bcrypt library | To hash passwords properly (already a project dependency) |
| `BCRYPT_ROUNDS = 12` | Matches app's password hashing cost | Consistency with `users.service.ts` |
| `bcrypt.hash('Admin123!', ...)` | Creates valid bcrypt hash | Seed users can actually log in now |
| Credential comments | Documents seed login credentials | Dev reference without looking at code |

**Commit**: `fix: use real bcrypt hashes in seed file`

---

## Step 3: Fix password validation inconsistency

**Why**: Auth's `register.dto.ts` uses a single combined regex + `.max(72)` (bcrypt limit). Users' `change-password.dto.ts` uses 3 separate regexes and no max. These should be identical since they validate the same thing — a new password.

**File**: `src/modules/users/dto/change-password.dto.ts`

**Full code** (complete file):

```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must not exceed 72 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
```

| Line/Block | What it does | Why we need it |
|---|---|---|
| `.max(72, ...)` | Limits password to 72 chars | bcrypt silently truncates at 72 bytes — longer passwords give false security |
| Single `.regex(...)` | Combined lookahead for uppercase, lowercase, digit | Matches auth's `register.dto.ts` pattern exactly |

**Commit**: `fix: standardize password validation with auth module`

---

## Step 4: Fix Users service type definitions

**Why**: Users service uses `Prisma.UserGetPayload<>` while Categories, Products, and Inventory all define types manually. Manual types are more maintainable and avoid potential Prisma GetPayload issues. All modules should follow the same pattern.

**File**: `src/modules/users/users.service.ts`

**Changes** (not full file — only the type definitions at the top):

Remove line 9:
```typescript
// DELETE THIS LINE:
import { Prisma } from '../../generated/prisma/client';
```

Replace line 32:
```typescript
// FROM:
type UserProfile = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
// TO:
type UserProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

Replace line 49:
```typescript
// FROM:
type UserAddress = Prisma.AddressGetPayload<{ select: typeof addressSelect }>;
// TO:
type UserAddress = {
  id: string;
  type: string;
  isDefault: boolean;
  fullName: string;
  phone: string | null;
  street: string;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
};
```

| Line/Block | What it does | Why we need it |
|---|---|---|
| Manual `UserProfile` type | Explicitly defines the response shape | Matches Categories/Products/Inventory pattern |
| Manual `UserAddress` type | Explicitly defines address response shape | Avoids Prisma.GetPayload dependency |
| Remove `Prisma` import | Cleans up unused import | No longer needed after removing GetPayload |

**Commit**: `refactor: use manual types in users service for consistency`

---

## Step 5: Fix TransformInterceptor — double-wrapping paginated responses

**Why**: `paginate()` returns `{ data: T[], meta: {...} }`. The interceptor blindly wraps everything in `{ success, data: <whatever>, timestamp }`. Paginated responses become `response.data.data` — double nested. The interceptor should detect pagination shape and spread it flat.

**File**: `src/common/interceptors/transform.interceptor.ts`

**Full code** (complete file):

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Type guard: checks if response has the PaginatedResult shape
function isPaginatedResponse(
  data: unknown,
): data is { data: unknown[]; meta: Record<string, unknown> } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'meta' in data &&
    Array.isArray((data as Record<string, unknown>).data)
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Spread paginated responses flat instead of nesting
        if (isPaginatedResponse(data)) {
          return {
            success: true as const,
            data: data.data as T,
            meta: data.meta as ApiResponse<T>['meta'],
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

| Line/Block | What it does | Why we need it |
|---|---|---|
| `isPaginatedResponse()` | Type guard checking for `{ data: [], meta: {} }` shape | Detects `paginate()` output without coupling to specific types |
| `Array.isArray(data.data)` | Ensures `data` field is an array | Prevents false positives on non-paginated objects that happen to have a `data` key |
| Spread branch | Pulls `data.data` and `data.meta` to top level | Produces `{ success, data: [...], meta: {...}, timestamp }` |
| Default branch | Wraps non-paginated data normally | Unchanged behavior for single-object responses |
| `meta?` on `ApiResponse` | Makes meta optional in the interface | Only present for paginated responses |

**Commit**: `fix: prevent double-wrapping of paginated responses in interceptor`

---

## Step 6: Fix Inventory module — not using pagination utilities

**Why**: `getLowStockProducts()` returns a raw array and `getMovementHistory()` uses a hardcoded `limit` with manual `parseInt`. Every other module uses `PaginationQueryDto` + `getPrismaPageArgs` + `paginate`. The inventory module should follow the same pattern.

### Step 6a: Update inventory service

**File**: `src/modules/inventory/inventory.service.ts`

**Changes** (add imports, modify two methods):

Add imports at top:
```typescript
import {
  getPrismaPageArgs,
  paginate,
  type PaginatedResult,
} from '../../common/utils/pagination.util';
import type { PaginationQuery } from '../../common/dto/pagination.dto';
```

Replace `getMovementHistory` method:
```typescript
async getMovementHistory(
  productId: string,
  query: PaginationQuery,
): Promise<PaginatedResult<StockMovement>> {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  const { skip, take } = getPrismaPageArgs(query);
  const where = { productId };

  const [movements, total] = await Promise.all([
    this.prisma.stockMovement.findMany({
      where,
      select: movementSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    this.prisma.stockMovement.count({ where }),
  ]);

  return paginate(movements, total, query);
}
```

Replace `getLowStockProducts` method:
```typescript
async getLowStockProducts(query: PaginationQuery): Promise<PaginatedResult<StockInfo>> {
  const { skip, take } = getPrismaPageArgs(query);

  // Fetch all active products (low-stock filter requires computed field)
  const products = await this.prisma.product.findMany({
    where: { isActive: true },
    select: stockInfoSelect,
  });

  // Filter for low stock (stock - reservedStock <= threshold is computed, can't filter in Prisma)
  const lowStockProducts = products
    .filter((p) => p.stock - p.reservedStock <= p.lowStockThreshold)
    .map((p) => ({
      ...p,
      availableStock: p.stock - p.reservedStock,
      isLowStock: true as const,
    }));

  // Paginate the filtered results
  const total = lowStockProducts.length;
  const paged = lowStockProducts.slice(skip, skip + take);

  return paginate(paged, total, query);
}
```

### Step 6b: Update inventory controller

**File**: `src/modules/inventory/inventory.controller.ts`

**Full code** (complete file):
```typescript
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { AdjustStockDto } from './dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { StockMovementType } from '../../generated/prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('low-stock')
  @Roles('ADMIN')
  getLowStockProducts(
    @Query() query: PaginationQueryDto,
  ): ReturnType<InventoryService['getLowStockProducts']> {
    return this.inventoryService.getLowStockProducts(query);
  }

  @Get(':productId')
  @Roles('ADMIN')
  getStock(@Param('productId') productId: string): ReturnType<InventoryService['getStock']> {
    return this.inventoryService.getStock(productId);
  }

  @Get(':productId/history')
  @Roles('ADMIN')
  getMovementHistory(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ): ReturnType<InventoryService['getMovementHistory']> {
    return this.inventoryService.getMovementHistory(productId, query);
  }

  @Post(':productId/adjust')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adjustStock(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('sub') userId: string,
  ): ReturnType<InventoryService['adjustStock']> {
    return this.inventoryService.adjustStock(
      productId,
      dto.quantity,
      StockMovementType[dto.type],
      userId,
      dto.reason,
    );
  }
}
```

| Line/Block | What it does | Why we need it |
|---|---|---|
| `PaginationQueryDto` import | Brings in the shared pagination DTO | Replaces manual `@Query('limit')` parsing |
| `@Query() query: PaginationQueryDto` | Zod-validated pagination params | Consistent with Categories, Products, Users controllers |
| `getPrismaPageArgs(query)` | Converts page/limit to skip/take | Reuses shared utility instead of manual parseInt |
| `Promise.all([findMany, count])` | Parallel query for data + total | Same pattern as Categories and Products services |
| `paginate(movements, total, query)` | Wraps in `PaginatedResult` | Consistent response format |
| `lowStockProducts.slice(skip, skip + take)` | In-memory pagination | Prisma can't filter on computed `stock - reservedStock` |

**Commit**: `refactor: add pagination to inventory endpoints for consistency`

---

## What's NOT Being Changed (by design)

| Item | Why it's fine |
|---|---|
| Guard ordering in app.module.ts | Order is correct, adding comments is over-documenting |
| Token blacklist in JwtAuthGuard | Future feature, not a current bug |
| Additional Prisma error codes | Current 4 codes cover all actual use cases |
| Path aliases in tsconfig | Nice-to-have, not a consistency issue |
| `_userId` destructuring in Users | Standard pattern to exclude fields from response |

---

## Verification

After all 6 steps:
1. `npx tsc --noEmit` — no type errors
2. `npm run lint` — no lint errors
3. `npm run build` — build succeeds
4. `npm run start:dev` — app starts
5. Paginated endpoints return `{ success, data: [...], meta: {...}, timestamp }`
6. Non-paginated endpoints return `{ success, data: {...}, timestamp }`
7. `npx tsx prisma/seed.ts` — seed works with real password hashes
8. Verify `generateSlug("Café Latte")` returns `"cafe-latte"`
