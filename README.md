# NestJS Ecommerce Backend

[![CI](https://github.com/Kris1027/nestjs-ecommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/Kris1027/nestjs-ecommerce/actions/workflows/ci.yml)

Single-vendor ecommerce REST API built with NestJS 11, TypeScript 5.7, Prisma 7, and PostgreSQL.

## Tech Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL with Prisma 7 ORM
- **Auth:** JWT access/refresh tokens with token family rotation
- **Payments:** Stripe (PaymentIntents + webhooks)
- **File Storage:** Cloudinary
- **Email:** Resend
- **Queue:** BullMQ (Redis)
- **Validation:** Zod + nestjs-zod
- **Docs:** Swagger/OpenAPI at `/docs`
- **Testing:** Jest (18 test suites, 416 tests)
- **Containerization:** Docker + Docker Compose
- **CI:** GitHub Actions (lint, test, build on every PR)

## Features

- **Auth** - Register, login, email verification, password reset, refresh token rotation
- **Users** - Profile management, addresses (CRUD), admin user management
- **Categories** - Hierarchical tree structure, slug-based URLs, image uploads
- **Products** - Filtering, search, sorting, pagination, Cloudinary image uploads
- **Inventory** - Stock tracking, reservations, movement audit trail, low-stock alerts
- **Cart** - Authenticated and guest carts, coupon application, guest-to-user merge on login
- **Orders** - Checkout with stock reservation, status workflow, address/price snapshots
- **Payments** - Stripe integration, webhook processing, refunds, abandoned payment cleanup
- **Reviews** - Purchase-verified, moderation workflow, denormalized ratings
- **Coupons** - Percentage/fixed, usage limits, minimum order, validity windows
- **Shipping** - Flat-rate methods, free shipping thresholds
- **Notifications** - In-app + email (15 templates), event-driven, user preferences
- **Background Jobs** - Email queue, 7 scheduled cleanup tasks
- **Health Checks** - Liveness and readiness probes (database + Redis)

## Global Pipeline

All requests flow through: Rate Limiting → JWT Auth → Role Guard → Zod Validation → Response Envelope → Exception Filter

## Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Seed database
pnpm prisma:seed

# Start dev server
pnpm start:dev
```

### Docker

```bash
docker compose up
```

## Scripts

```bash
pnpm start:dev        # Dev server with hot reload
pnpm build            # Compile TypeScript
pnpm lint             # ESLint with auto-fix
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:cov         # Coverage report
```

## API Docs

Swagger UI available at `/docs` in non-production environments (91 documented endpoints).

## License

[UNLICENSED](LICENSE)
