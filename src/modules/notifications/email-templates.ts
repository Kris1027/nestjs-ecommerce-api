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
