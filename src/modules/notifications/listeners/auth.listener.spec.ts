import { Logger } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthListener } from './auth.listener';
import { NotificationsService } from '../notifications.service';
import { UserRegisteredEvent, PasswordChangedEvent } from '../events';
import { NotificationType } from '../../../generated/prisma/client';

function createMockNotificationsService(): { notify: jest.Mock } {
  return { notify: jest.fn().mockResolvedValue(undefined) };
}

describe('AuthListener', () => {
  let listener: AuthListener;
  let notificationsService: ReturnType<typeof createMockNotificationsService>;

  beforeEach(async () => {
    notificationsService = createMockNotificationsService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthListener, { provide: NotificationsService, useValue: notificationsService }],
    }).compile();

    listener = module.get<AuthListener>(AuthListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleUserRegistered', () => {
    it('should notify with WELCOME type and email', async () => {
      const event = new UserRegisteredEvent('user1', 'test@example.com', 'John');

      await listener.handleUserRegistered(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.WELCOME,
          title: 'Welcome!',
          email: expect.objectContaining({ to: 'test@example.com' }),
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('DB down'));
      const event = new UserRegisteredEvent('user1', 'test@example.com', 'John');

      await expect(listener.handleUserRegistered(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle user.registered'),
      );
    });
  });

  describe('handlePasswordChanged', () => {
    it('should notify with PASSWORD_CHANGED type and email', async () => {
      const event = new PasswordChangedEvent('user1', 'test@example.com', 'John');

      await listener.handlePasswordChanged(event);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: NotificationType.PASSWORD_CHANGED,
          title: 'Password changed',
          email: expect.objectContaining({ to: 'test@example.com' }),
        }),
      );
    });

    it('should catch and log errors without throwing', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      notificationsService.notify.mockRejectedValue(new Error('DB down'));
      const event = new PasswordChangedEvent('user1', 'test@example.com', 'John');

      await expect(listener.handlePasswordChanged(event)).resolves.toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to handle password.changed'),
      );
    });
  });
});
