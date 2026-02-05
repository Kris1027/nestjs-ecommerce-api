import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../../generated/prisma/client';
import { NotificationsService } from '../notifications.service';
import { NotificationEvents, UserRegisteredEvent, PasswordChangedEvent } from '../events';
import { welcomeEmail, passwordChangedEmail } from '../email-templates';

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NotificationEvents.USER_REGISTERED, { async: true })
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      const email = welcomeEmail(event.userFirstName);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.WELCOME,
        title: 'Welcome!',
        body: 'Thank you for creating an account. Start browsing our products!',
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle user.registered: ${msg}`);
    }
  }

  @OnEvent(NotificationEvents.PASSWORD_CHANGED, { async: true })
  async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
    try {
      const email = passwordChangedEmail(event.userFirstName);

      await this.notificationsService.notify({
        userId: event.userId,
        type: NotificationType.PASSWORD_CHANGED,
        title: 'Password changed',
        body: 'Your password was successfully changed.',
        email: { to: event.userEmail, ...email },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle password.changed: ${msg}`);
    }
  }
}
