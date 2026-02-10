import { Test, type TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

function createMockReviewsService(): Record<keyof ReviewsService, jest.Mock> {
  return {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByProduct: jest.fn(),
    findAll: jest.fn(),
    adminUpdate: jest.fn(),
    adminDelete: jest.fn(),
  };
}

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReturnType<typeof createMockReviewsService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockReviewsService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: service }],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  describe('findByProduct', () => {
    it('should call reviewsService.findByProduct with productId and query', async () => {
      const productId = 'prod1';
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.findByProduct.mockResolvedValue(expected);

      const result = await controller.findByProduct(productId, query as any);

      expect(service.findByProduct).toHaveBeenCalledWith(productId, query);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // CUSTOMER ENDPOINTS
  // ============================================

  describe('create', () => {
    it('should call reviewsService.create with userId, productId, and DTO', async () => {
      const productId = 'prod1';
      const dto = { rating: 5, title: 'Great', comment: 'Loved it' };
      const expected = { id: 'rev1', rating: 5 };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(userId, productId, dto as any);

      expect(service.create).toHaveBeenCalledWith(userId, productId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call reviewsService.update with userId, reviewId, and DTO', async () => {
      const reviewId = 'rev1';
      const dto = { rating: 4, comment: 'Updated comment' };
      const expected = { id: reviewId, rating: 4, status: 'PENDING' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(userId, reviewId, dto as any);

      expect(service.update).toHaveBeenCalledWith(userId, reviewId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('should call reviewsService.delete with userId and reviewId', async () => {
      const reviewId = 'rev1';
      const expected = { message: 'Review deleted' };
      service.delete.mockResolvedValue(expected);

      const result = await controller.delete(userId, reviewId);

      expect(service.delete).toHaveBeenCalledWith(userId, reviewId);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('findAll', () => {
    it('should call reviewsService.findAll with query', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('adminUpdate', () => {
    it('should call reviewsService.adminUpdate with reviewId and DTO', async () => {
      const reviewId = 'rev1';
      const dto = { status: 'APPROVED' };
      const expected = { id: reviewId, status: 'APPROVED' };
      service.adminUpdate.mockResolvedValue(expected);

      const result = await controller.adminUpdate(reviewId, dto as any);

      expect(service.adminUpdate).toHaveBeenCalledWith(reviewId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('adminDelete', () => {
    it('should call reviewsService.adminDelete with reviewId', async () => {
      const reviewId = 'rev1';
      const expected = { message: 'Review deleted' };
      service.adminDelete.mockResolvedValue(expected);

      const result = await controller.adminDelete(reviewId);

      expect(service.adminDelete).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(expected);
    });
  });
});
