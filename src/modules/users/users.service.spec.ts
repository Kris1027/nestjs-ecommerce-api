import { Test, type TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockPrismaClient, resetMockPrismaClient } from '@test/mocks/prisma.mock';
import { createMockEventEmitter } from '@test/mocks/common.mock';
import { createMockUser } from '@test/fixtures/user.fixture';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaClient>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    prisma = createMockPrismaClient();
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    resetMockPrismaClient(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({ id: true, email: true, role: true }),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = createMockUser({ firstName: 'Jane' });
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { firstName: 'Jane' });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'Jane' },
        select: expect.objectContaining({ id: true, email: true }),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password and emit event', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({} as never);

      const result = await service.changePassword('user-1', 'OldPass123', 'NewPass456');

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPass123', mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass456', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'hashed-password' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for wrong current password', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.changePassword('user-1', 'WrongPass', 'NewPass456')).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('nonexistent', 'Old', 'New')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  const mockAddress = {
    id: 'addr-1',
    type: 'SHIPPING',
    isDefault: false,
    fullName: 'John Doe',
    phone: '+48123456789',
    street: '123 Main St',
    city: 'Warsaw',
    region: null,
    postalCode: '00-001',
    country: 'PL',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAddresses', () => {
    it('should return all addresses for user', async () => {
      prisma.address.findMany.mockResolvedValue([mockAddress]);

      const result = await service.getAddresses('user-1');

      expect(result).toEqual([mockAddress]);
      expect(prisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: expect.objectContaining({ id: true, street: true }),
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('getAddress', () => {
    it('should return address if owned by user', async () => {
      prisma.address.findUnique.mockResolvedValue({ ...mockAddress, userId: 'user-1' });

      const result = await service.getAddress('user-1', 'addr-1');

      expect(result).not.toHaveProperty('userId');
      expect(result).toHaveProperty('id', 'addr-1');
    });

    it('should throw NotFoundException if address not found', async () => {
      prisma.address.findUnique.mockResolvedValue(null);

      await expect(service.getAddress('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if address belongs to another user', async () => {
      prisma.address.findUnique.mockResolvedValue({ ...mockAddress, userId: 'other-user' });

      await expect(service.getAddress('user-1', 'addr-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createAddress', () => {
    it('should create address', async () => {
      const createData = {
        type: 'SHIPPING' as const,
        isDefault: false,
        fullName: 'John Doe',
        phone: '+48123456789',
        street: '123 Main St',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'PL',
      };
      prisma.address.create.mockResolvedValue(mockAddress);

      const result = await service.createAddress('user-1', createData);

      expect(result).toEqual(mockAddress);
      expect(prisma.address.updateMany).not.toHaveBeenCalled();
    });

    it('should unset previous default before creating new default', async () => {
      const createData = {
        type: 'SHIPPING' as const,
        isDefault: true,
        fullName: 'John Doe',
        phone: '+48123456789',
        street: '123 Main St',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'PL',
      };
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.create.mockResolvedValue({ ...mockAddress, isDefault: true });

      await service.createAddress('user-1', createData);

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'SHIPPING', isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('updateAddress', () => {
    it('should update address if owned by user', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'user-1', type: 'SHIPPING' });
      const updatedAddress = { ...mockAddress, street: '456 New St' };
      prisma.address.update.mockResolvedValue(updatedAddress);

      const result = await service.updateAddress('user-1', 'addr-1', { street: '456 New St' });

      expect(result).toEqual(updatedAddress);
    });

    it('should unset old defaults when setting as default', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'user-1', type: 'SHIPPING' });
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue({ ...mockAddress, isDefault: true });

      await service.updateAddress('user-1', 'addr-1', { isDefault: true });

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'SHIPPING', isDefault: true, id: { not: 'addr-1' } },
        data: { isDefault: false },
      });
    });

    it('should throw ForbiddenException if not owned', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'other-user', type: 'SHIPPING' });

      await expect(service.updateAddress('user-1', 'addr-1', { street: 'hack' })).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.address.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete address if owned by user', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'user-1' });
      prisma.address.delete.mockResolvedValue({} as never);

      const result = await service.deleteAddress('user-1', 'addr-1');

      expect(result).toEqual({ message: 'Address deleted successfully' });
      expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
    });

    it('should throw NotFoundException if address not found', async () => {
      prisma.address.findUnique.mockResolvedValue(null);

      await expect(service.deleteAddress('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owned', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'other-user' });

      await expect(service.deleteAddress('user-1', 'addr-1')).rejects.toThrow(ForbiddenException);

      expect(prisma.address.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [createMockUser()];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data).toEqual(mockUsers);
      expect(result.meta).toEqual(expect.objectContaining({ total: 1, page: 1, limit: 10 }));
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminUpdateUser', () => {
    it('should update user', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser());
      const updatedUser = createMockUser({ firstName: 'Updated' });
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.adminUpdateUser('user-1', { firstName: 'Updated' });

      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.adminUpdateUser('nonexistent', { firstName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate active user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      prisma.user.update.mockResolvedValue({} as never);

      const result = await service.deactivateUser('user-1');

      expect(result).toEqual({ message: 'User deactivated successfully' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException if already deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: false });

      await expect(service.deactivateUser('user-1')).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivateUser('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hardDeleteUser', () => {
    it('should permanently delete user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.user.delete.mockResolvedValue({} as never);

      const result = await service.hardDeleteUser('user-1');

      expect(result).toEqual({ message: 'User permanently deleted' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.hardDeleteUser('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
