import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { NotificationQueryDto, UpdatePreferenceDto } from './dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============================================
  // CUSTOMER ENDPOINTS (authenticated, any role)
  // ============================================

  // List my notifications (paginated, filterable by isRead and type)
  @Get()
  findUserNotifications(
    @CurrentUser('sub') userId: string,
    @Query() query: NotificationQueryDto,
  ): ReturnType<NotificationsService['findUserNotifications']> {
    return this.notificationsService.findUserNotifications(userId, query);
  }

  // Get unread count for UI notification badge
  @Get('unread-count')
  getUnreadCount(
    @CurrentUser('sub') userId: string,
  ): ReturnType<NotificationsService['getUnreadCount']> {
    return this.notificationsService.getUnreadCount(userId);
  }

  // Mark a single notification as read
  @Patch(':id/read')
  markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): ReturnType<NotificationsService['markAsRead']> {
    return this.notificationsService.markAsRead(userId, id);
  }

  // Mark all my notifications as read
  @Patch('read-all')
  markAllAsRead(
    @CurrentUser('sub') userId: string,
  ): ReturnType<NotificationsService['markAllAsRead']> {
    return this.notificationsService.markAllAsRead(userId);
  }

  // Get my notification preferences
  @Get('preferences')
  getPreferences(
    @CurrentUser('sub') userId: string,
  ): ReturnType<NotificationsService['getPreferences']> {
    return this.notificationsService.getPreferences(userId);
  }

  // Update a single notification preference (type + channel + enabled)
  @Put('preferences')
  updatePreference(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePreferenceDto,
  ): ReturnType<NotificationsService['updatePreference']> {
    return this.notificationsService.updatePreference(userId, dto);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // Admin views all notifications across all users
  @Get('admin')
  @Roles('ADMIN')
  findAll(@Query() query: NotificationQueryDto): ReturnType<NotificationsService['findAll']> {
    return this.notificationsService.findAll(query);
  }
}
