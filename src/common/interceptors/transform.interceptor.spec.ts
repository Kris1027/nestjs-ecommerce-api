import { type CallHandler, type ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor, type ApiResponse } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  const mockContext = {} as ExecutionContext;

  async function runInterceptor(data: unknown): Promise<ApiResponse<unknown>> {
    const callHandler: CallHandler = { handle: () => of(data) };
    const result$ = interceptor.intercept(mockContext, callHandler);
    return lastValueFrom(result$);
  }

  describe('standard responses', () => {
    it('should wrap response in { success, data, timestamp } envelope', async () => {
      const result = await runInterceptor({ id: '1', name: 'Test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '1', name: 'Test' });
      expect(result.timestamp).toBeDefined();
      expect(result.meta).toBeUndefined();
    });

    it('should wrap array responses', async () => {
      const result = await runInterceptor([{ id: '1' }, { id: '2' }]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should wrap null responses', async () => {
      const result = await runInterceptor(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should wrap string responses', async () => {
      const result = await runInterceptor('simple string');

      expect(result.success).toBe(true);
      expect(result.data).toBe('simple string');
    });
  });

  describe('paginated responses', () => {
    it('should flatten paginated response with meta at top level', async () => {
      const paginatedData = {
        data: [{ id: '1' }, { id: '2' }],
        meta: {
          total: 10,
          page: 1,
          limit: 2,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false,
        },
      };

      const result = await runInterceptor(paginatedData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(result.meta).toEqual(paginatedData.meta);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('timestamp', () => {
    it('should include a valid ISO timestamp', async () => {
      const result = await runInterceptor({});

      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
