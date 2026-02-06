// ============================================
// Email template functions - pure TS, no template engine
// Each returns { subject, html } for use with Resend API
// ============================================

// Shared wrapper that adds consistent styling to all emails
function wrapHtml(title: string, body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${title}</h1>
      ${body}
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
}

// ============================================
// AUTH TEMPLATES
// ============================================

export function welcomeEmail(firstName: string | null): { subject: string; html: string } {
  return {
    subject: 'Welcome to our store!',
    html: wrapHtml(
      'Welcome!',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Thank you for creating an account. We're excited to have you!</p>
       <p>Start browsing our products and find something you love.</p>`,
    ),
  };
}

export function passwordChangedEmail(firstName: string | null): { subject: string; html: string } {
  return {
    subject: 'Your password has been changed',
    html: wrapHtml(
      'Password Changed',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your password was successfully changed.</p>
       <p>If you did not make this change, please contact support immediately.</p>`,
    ),
  };
}

export function emailVerificationEmail(
  firstName: string | null,
  verifyUrl: string,
): { subject: string; html: string } {
  return {
    subject: 'Verify your email address',
    html: wrapHtml(
      'Verify Your Email',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Please verify your email address by clicking the button below:</p>
       <p style="margin: 20px 0;">
         <a href="${verifyUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
       </p>
       <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
       <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>`,
    ),
  };
}

export function passwordResetEmail(
  firstName: string | null,
  resetUrl: string,
): { subject: string; html: string } {
  return {
    subject: 'Reset your password',
    html: wrapHtml(
      'Reset Your Password',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>We received a request to reset your password. Click the button below to create a new password:</p>
       <p style="margin: 20px 0;">
         <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
       </p>
       <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
       <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
       <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>`,
    ),
  };
}

// ============================================
// ORDER TEMPLATES
// ============================================

export function orderCreatedEmail(
  firstName: string | null,
  orderNumber: string,
  total: string, // Pre-formatted decimal string (e.g., "129.99")
): { subject: string; html: string } {
  return {
    subject: `Order ${orderNumber} confirmed`,
    html: wrapHtml(
      'Order Confirmed',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
       <p>Total: <strong>${total} PLN</strong></p>
       <p>We'll notify you when your order ships.</p>`,
    ),
  };
}

export function orderShippedEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Order ${orderNumber} shipped`,
    html: wrapHtml(
      'Order Shipped',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your order <strong>${orderNumber}</strong> is on its way!</p>
       <p>You'll receive another notification when it's delivered.</p>`,
    ),
  };
}

export function orderDeliveredEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Order ${orderNumber} delivered`,
    html: wrapHtml(
      'Order Delivered',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your order <strong>${orderNumber}</strong> has been delivered.</p>
       <p>We hope you enjoy your purchase! Consider leaving a review.</p>`,
    ),
  };
}

export function orderCancelledEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Order ${orderNumber} cancelled`,
    html: wrapHtml(
      'Order Cancelled',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your order <strong>${orderNumber}</strong> has been cancelled.</p>
       <p>If you were charged, a refund will be processed automatically.</p>`,
    ),
  };
}

// ============================================
// PAYMENT TEMPLATES
// ============================================

export function paymentSucceededEmail(
  firstName: string | null,
  orderNumber: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: `Payment received for order ${orderNumber}`,
    html: wrapHtml(
      'Payment Received',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>We've received your payment of <strong>${amount} PLN</strong> for order <strong>${orderNumber}</strong>.</p>
       <p>Your order is now being processed.</p>`,
    ),
  };
}

export function paymentFailedEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Payment failed for order ${orderNumber}`,
    html: wrapHtml(
      'Payment Failed',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your payment for order <strong>${orderNumber}</strong> was not successful.</p>
       <p>Please try again or use a different payment method.</p>`,
    ),
  };
}

export function refundInitiatedEmail(
  firstName: string | null,
  orderNumber: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: `Refund initiated for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Initiated',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>A refund of <strong>${amount} PLN</strong> has been initiated for order <strong>${orderNumber}</strong>.</p>
       <p>Please allow 5-10 business days for the refund to appear on your statement.</p>`,
    ),
  };
}

export function refundCompletedEmail(
  firstName: string | null,
  orderNumber: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: `Refund completed for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Completed',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Your refund of <strong>${amount} PLN</strong> for order <strong>${orderNumber}</strong> has been completed.</p>
       <p>The amount should appear on your statement shortly.</p>`,
    ),
  };
}

export function refundFailedEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Refund issue for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Issue',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>There was an issue processing the refund for order <strong>${orderNumber}</strong>.</p>
       <p>Our team has been notified and will resolve this shortly. Please contact support if needed.</p>`,
    ),
  };
}

// ============================================
// INVENTORY TEMPLATES (admin only)
// ============================================

export function lowStockEmail(
  productName: string,
  currentStock: number,
  threshold: number,
): { subject: string; html: string } {
  return {
    subject: `Low stock alert: ${productName}`,
    html: wrapHtml(
      'Low Stock Alert',
      `<p><strong>${productName}</strong> is running low on stock.</p>
       <p>Current stock: <strong>${currentStock}</strong> (threshold: ${threshold})</p>
       <p>Please restock soon to avoid stockouts.</p>`,
    ),
  };
}

// ============================================
// REFUND REQUEST TEMPLATES
// ============================================

export function refundRequestReceivedEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Refund request received for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Request Received',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>We've received your refund request for order <strong>${orderNumber}</strong>.</p>
       <p>Our team will review your request and get back to you within 2-3 business days.</p>
       <p>You can check the status of your request in your order history.</p>`,
    ),
  };
}

export function refundRequestApprovedEmail(
  firstName: string | null,
  orderNumber: string,
): { subject: string; html: string } {
  return {
    subject: `Refund request approved for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Request Approved',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>Great news! Your refund request for order <strong>${orderNumber}</strong> has been approved.</p>
       <p>The refund will be processed shortly and you'll receive a confirmation once it's complete.</p>`,
    ),
  };
}

export function refundRequestRejectedEmail(
  firstName: string | null,
  orderNumber: string,
  reason: string | null,
): { subject: string; html: string } {
  return {
    subject: `Refund request update for order ${orderNumber}`,
    html: wrapHtml(
      'Refund Request Update',
      `<p>Hi ${firstName ?? 'there'},</p>
       <p>We've reviewed your refund request for order <strong>${orderNumber}</strong>.</p>
       <p>Unfortunately, we're unable to process your refund at this time.</p>
       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
       <p>If you have any questions, please contact our support team.</p>`,
    ),
  };
}

export function refundRequestAdminEmail(
  orderNumber: string,
  customerEmail: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: `New refund request: ${orderNumber}`,
    html: wrapHtml(
      'New Refund Request',
      `<p>A customer has submitted a refund request.</p>
       <p><strong>Order:</strong> ${orderNumber}</p>
       <p><strong>Customer:</strong> ${customerEmail}</p>
       <p><strong>Reason:</strong></p>
       <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${reason}</p>
       <p>Please review this request in the admin dashboard.</p>`,
    ),
  };
}
