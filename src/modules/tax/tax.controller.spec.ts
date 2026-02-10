import { Test, type TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

function createMockTaxService(): Record<keyof TaxService, jest.Mock> {
  return {
    calculateTax: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
}

describe('TaxController', () => {
  let controller: TaxController;
  let service: ReturnType<typeof createMockTaxService>;

  beforeEach(async () => {
    service = createMockTaxService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [{ provide: TaxService, useValue: service }],
    }).compile();

    controller = module.get<TaxController>(TaxController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call taxService.create with DTO', async () => {
      const dto = { name: 'VAT', rate: '23.00', country: 'PL' };
      const expected = { id: 'tax1', ...dto };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should call taxService.findAll', async () => {
      const expected = [{ id: 'tax1', name: 'VAT', rate: '23.00' }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should call taxService.findOne with id', async () => {
      const id = 'tax1';
      const expected = { id, name: 'VAT' };
      service.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should call taxService.update with id and DTO', async () => {
      const id = 'tax1';
      const dto = { rate: '25.00' };
      const expected = { id, rate: '25.00' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(id, dto as any);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should call taxService.remove with id', async () => {
      const id = 'tax1';
      const expected = { message: 'Tax rate deleted' };
      service.remove.mockResolvedValue(expected);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });
});
