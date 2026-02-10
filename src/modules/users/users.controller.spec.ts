import { Test, type TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

function createMockUsersService(): Record<keyof UsersService, jest.Mock> {
  return {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getAddresses: jest.fn(),
    getAddress: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    adminUpdateUser: jest.fn(),
    deactivateUser: jest.fn(),
    hardDeleteUser: jest.fn(),
  };
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof createMockUsersService>;

  const userId = 'user123';

  beforeEach(async () => {
    service = createMockUsersService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================
  // USER ENDPOINTS
  // ============================================

  describe('getProfile', () => {
    it('should call usersService.getProfile with userId', async () => {
      const expected = { id: userId, email: 'test@example.com' };
      service.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(userId);

      expect(service.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('updateProfile', () => {
    it('should call usersService.updateProfile with userId and DTO', async () => {
      const dto = { firstName: 'John', lastName: 'Doe' };
      const expected = { id: userId, ...dto };
      service.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateProfile(userId, dto as any);

      expect(service.updateProfile).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('changePassword', () => {
    it('should call usersService.changePassword with userId and extracted fields', async () => {
      const dto = { currentPassword: 'OldPass1', newPassword: 'NewPass1' };
      const expected = { message: 'Password changed' };
      service.changePassword.mockResolvedValue(expected);

      const result = await controller.changePassword(userId, dto as any);

      // Controller destructures dto — passes individual fields, not the whole DTO
      expect(service.changePassword).toHaveBeenCalledWith(
        userId,
        dto.currentPassword,
        dto.newPassword,
      );
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADDRESS ENDPOINTS
  // ============================================

  describe('getAddresses', () => {
    it('should call usersService.getAddresses with userId', async () => {
      const expected = [{ id: 'addr1', street: '123 Main St' }];
      service.getAddresses.mockResolvedValue(expected);

      const result = await controller.getAddresses(userId);

      expect(service.getAddresses).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expected);
    });
  });

  describe('createAddress', () => {
    it('should call usersService.createAddress with userId and DTO', async () => {
      const dto = { street: '123 Main St', city: 'Warsaw', postalCode: '00-001' };
      const expected = { id: 'addr1', ...dto };
      service.createAddress.mockResolvedValue(expected);

      const result = await controller.createAddress(userId, dto as any);

      expect(service.createAddress).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getAddress', () => {
    it('should call usersService.getAddress with userId and addressId', async () => {
      const addressId = 'addr1';
      const expected = { id: addressId, street: '123 Main St' };
      service.getAddress.mockResolvedValue(expected);

      const result = await controller.getAddress(userId, addressId);

      expect(service.getAddress).toHaveBeenCalledWith(userId, addressId);
      expect(result).toEqual(expected);
    });
  });

  describe('updateAddress', () => {
    it('should call usersService.updateAddress with userId, addressId, and DTO', async () => {
      const addressId = 'addr1';
      const dto = { street: '456 Oak Ave' };
      const expected = { id: addressId, ...dto };
      service.updateAddress.mockResolvedValue(expected);

      const result = await controller.updateAddress(userId, addressId, dto as any);

      expect(service.updateAddress).toHaveBeenCalledWith(userId, addressId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteAddress', () => {
    it('should call usersService.deleteAddress with userId and addressId', async () => {
      const addressId = 'addr1';
      const expected = { message: 'Address deleted' };
      service.deleteAddress.mockResolvedValue(expected);

      const result = await controller.deleteAddress(userId, addressId);

      expect(service.deleteAddress).toHaveBeenCalledWith(userId, addressId);
      expect(result).toEqual(expected);
    });
  });

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  describe('findAll', () => {
    it('should call usersService.findAll with query params', async () => {
      const query = { page: 1, limit: 10, sortOrder: 'desc' as const };
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should call usersService.findById with userId', async () => {
      const targetId = 'target-user-id';
      const expected = { id: targetId, email: 'user@example.com' };
      service.findById.mockResolvedValue(expected);

      const result = await controller.findById(targetId);

      expect(service.findById).toHaveBeenCalledWith(targetId);
      expect(result).toEqual(expected);
    });
  });

  describe('adminUpdateUser', () => {
    it('should call usersService.adminUpdateUser with userId and DTO', async () => {
      const targetId = 'target-user-id';
      const dto = { role: 'ADMIN' };
      const expected = { id: targetId, role: 'ADMIN' };
      service.adminUpdateUser.mockResolvedValue(expected);

      const result = await controller.adminUpdateUser(targetId, dto as any);

      expect(service.adminUpdateUser).toHaveBeenCalledWith(targetId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deactivateUser', () => {
    it('should call usersService.deactivateUser with userId', async () => {
      const targetId = 'target-user-id';
      const expected = { message: 'User deactivated' };
      service.deactivateUser.mockResolvedValue(expected);

      const result = await controller.deactivateUser(targetId);

      expect(service.deactivateUser).toHaveBeenCalledWith(targetId);
      expect(result).toEqual(expected);
    });
  });

  describe('hardDeleteUser', () => {
    it('should call usersService.hardDeleteUser with userId', async () => {
      const targetId = 'target-user-id';
      const expected = { message: 'User deleted' };
      service.hardDeleteUser.mockResolvedValue(expected);

      const result = await controller.hardDeleteUser(targetId);

      expect(service.hardDeleteUser).toHaveBeenCalledWith(targetId);
      expect(result).toEqual(expected);
    });
  });
});
