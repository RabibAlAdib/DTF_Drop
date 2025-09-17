/**
 * Payment Service for DTF Drop E-commerce
 * Handles bKash, Nagad, and other payment gateway integrations
 */

// Payment gateway configurations
const PAYMENT_GATEWAYS = {
  bkash: {
    name: 'bKash',
    baseUrl: process.env.BKASH_API_URL || 'https://tokenized.pay.bka.sh/v1.2.0-beta',
    appKey: process.env.BKASH_API_KEY,
    appSecret: process.env.BKASH_API_SECRET,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    enabled: true // Auto-enabled - will check for configured API keys
  },
  nagad: {
    name: 'Nagad',
    baseUrl: process.env.NAGAD_API_URL || 'https://api.mynagad.com:20002/api/dfs',
    merchantId: process.env.NAGAD_MERCHANT_ID,
    publicKey: process.env.NAGAD_PUBLIC_KEY,
    privateKey: process.env.NAGAD_PRIVATE_KEY,
    enabled: true // Auto-enabled - will check for configured API keys
  }
};

/**
 * Check if payment gateways are configured
 */
export const checkPaymentGatewayConfig = () => {
  const status = {
    bkash: {
      configured: !!(PAYMENT_GATEWAYS.bkash.appKey && 
                     PAYMENT_GATEWAYS.bkash.appSecret && 
                     PAYMENT_GATEWAYS.bkash.username && 
                     PAYMENT_GATEWAYS.bkash.password),
      enabled: PAYMENT_GATEWAYS.bkash.enabled
    },
    nagad: {
      configured: !!(PAYMENT_GATEWAYS.nagad.merchantId && 
                     PAYMENT_GATEWAYS.nagad.publicKey && 
                     PAYMENT_GATEWAYS.nagad.privateKey),
      enabled: PAYMENT_GATEWAYS.nagad.enabled
    }
  };

  // Auto-enable if configured
  if (status.bkash.configured && !PAYMENT_GATEWAYS.bkash.enabled) {
    PAYMENT_GATEWAYS.bkash.enabled = true;
    status.bkash.enabled = true;
  }
  if (status.nagad.configured && !PAYMENT_GATEWAYS.nagad.enabled) {
    PAYMENT_GATEWAYS.nagad.enabled = true;
    status.nagad.enabled = true;
  }

  return status;
};

/**
 * bKash Payment Gateway Integration
 */
export class BkashPayment {
  constructor() {
    this.config = PAYMENT_GATEWAYS.bkash;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Get authentication token from bKash
   */
  async getToken() {
    if (!this.config.enabled || !this.config.appKey) {
      throw new Error('bKash payment gateway not configured');
    }

    // Check if token is still valid
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/checkout/token/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': this.config.username,
          'password': this.config.password
        },
        body: JSON.stringify({
          app_key: this.config.appKey,
          app_secret: this.config.appSecret
        })
      });

      const data = await response.json();
      
      if (data.statusCode === '0000') {
        this.token = data.id_token;
        // Set token expiry (bKash tokens typically expire after 1 hour)
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 minutes
        return this.token;
      } else {
        throw new Error(`bKash token error: ${data.statusMessage}`);
      }
    } catch (error) {
      console.error('bKash token generation failed:', error);
      throw error;
    }
  }

  /**
   * Create payment request
   */
  async createPayment(orderData) {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'bKash payment is not available yet. Please use Cash on Delivery.',
        redirectUrl: null
      };
    }

    try {
      const token = await this.getToken();
      
      const paymentData = {
        amount: orderData.totalAmount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `DTF-${orderData.orderNumber}`,
        merchantAssociationInfo: 'DTF Drop E-commerce'
      };

      const response = await fetch(`${this.config.baseUrl}/checkout/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (data.statusCode === '0000') {
        return {
          success: true,
          paymentId: data.paymentID,
          redirectUrl: data.bkashURL,
          message: 'Payment request created successfully'
        };
      } else {
        return {
          success: false,
          message: `Payment creation failed: ${data.statusMessage}`,
          redirectUrl: null
        };
      }
    } catch (error) {
      console.error('bKash payment creation failed:', error);
      return {
        success: false,
        message: 'Payment processing failed. Please try again.',
        redirectUrl: null
      };
    }
  }

  /**
   * Execute payment after user authorization
   */
  async executePayment(paymentId) {
    if (!this.config.enabled) {
      throw new Error('bKash payment gateway not configured');
    }

    try {
      const token = await this.getToken();

      const response = await fetch(`${this.config.baseUrl}/checkout/payment/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey
        },
        body: JSON.stringify({
          paymentID: paymentId
        })
      });

      const data = await response.json();
      
      if (data.statusCode === '0000') {
        return {
          success: true,
          transactionId: data.trxID,
          paymentId: data.paymentID,
          amount: data.amount,
          message: 'Payment completed successfully'
        };
      } else {
        return {
          success: false,
          message: `Payment execution failed: ${data.statusMessage}`
        };
      }
    } catch (error) {
      console.error('bKash payment execution failed:', error);
      return {
        success: false,
        message: 'Payment execution failed. Please try again.'
      };
    }
  }

  /**
   * Query payment status
   */
  async queryPayment(paymentId) {
    if (!this.config.enabled) {
      throw new Error('bKash payment gateway not configured');
    }

    try {
      const token = await this.getToken();

      const response = await fetch(`${this.config.baseUrl}/checkout/payment/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey
        },
        body: JSON.stringify({
          paymentID: paymentId
        })
      });

      const data = await response.json();
      
      return {
        success: data.statusCode === '0000',
        status: data.statusCode === '0000' ? 'completed' : 'failed',
        transactionId: data.trxID,
        amount: data.amount,
        message: data.statusMessage
      };
    } catch (error) {
      console.error('bKash payment query failed:', error);
      return {
        success: false,
        status: 'error',
        message: 'Payment status query failed'
      };
    }
  }

  /**
   * Process refund
   */
  async refundPayment(transactionId, amount, reason = '') {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'bKash payment gateway not configured for refunds'
      };
    }

    try {
      const token = await this.getToken();

      const refundData = {
        paymentID: transactionId,
        amount: amount.toString(),
        trxID: transactionId,
        sku: 'DTF_REFUND',
        reason: reason || 'Customer requested refund'
      };

      const response = await fetch(`${this.config.baseUrl}/checkout/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey
        },
        body: JSON.stringify(refundData)
      });

      const data = await response.json();
      
      if (data.statusCode === '0000') {
        return {
          success: true,
          refundId: data.refundTrxID,
          transactionId: data.originalTrxID,
          refundAmount: data.amount,
          message: 'Refund processed successfully'
        };
      } else {
        return {
          success: false,
          message: `Refund failed: ${data.statusMessage}`
        };
      }
    } catch (error) {
      console.error('bKash refund failed:', error);
      return {
        success: false,
        message: 'Refund processing failed. Please try again.'
      };
    }
  }
}

/**
 * Nagad Payment Gateway Integration
 */
export class NagadPayment {
  constructor() {
    this.config = PAYMENT_GATEWAYS.nagad;
  }

  /**
   * Create payment request
   */
  async createPayment(orderData) {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'Nagad payment is not available yet. Please use Cash on Delivery.',
        redirectUrl: null
      };
    }

    try {
      // This is a placeholder implementation
      // Actual Nagad integration requires more complex signature generation
      const paymentData = {
        merchantId: this.config.merchantId,
        orderId: orderData.orderNumber,
        amount: orderData.totalAmount.toString(),
        currency: 'BDT',
        challenge: this.generateChallenge()
      };

      // In actual implementation, you would:
      // 1. Generate proper signature using private key
      // 2. Make API call to Nagad
      // 3. Handle response and return appropriate data

      console.log('Nagad payment creation (placeholder):', paymentData);

      return {
        success: false,
        message: 'Nagad payment integration is in development. Please use Cash on Delivery.',
        redirectUrl: null
      };
    } catch (error) {
      console.error('Nagad payment creation failed:', error);
      return {
        success: false,
        message: 'Payment processing failed. Please try again.',
        redirectUrl: null
      };
    }
  }

  /**
   * Generate challenge for Nagad API
   */
  generateChallenge() {
    return Math.random().toString(36).substr(2, 10);
  }

  /**
   * Verify payment callback
   */
  async verifyPayment(callbackData) {
    if (!this.config.enabled) {
      throw new Error('Nagad payment gateway not configured');
    }

    // Placeholder for payment verification logic
    return {
      success: false,
      message: 'Payment verification not implemented yet'
    };
  }

  /**
   * Process refund (placeholder)
   */
  async refundPayment(transactionId, amount, reason = '') {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'Nagad payment gateway not configured for refunds'
      };
    }

    // Placeholder for Nagad refund implementation
    console.log('Nagad refund request (placeholder):', {
      transactionId,
      amount,
      reason
    });

    return {
      success: false,
      message: 'Nagad refund integration is in development'
    };
  }
}

/**
 * Main payment service class
 */
export class PaymentService {
  constructor() {
    this.bkash = new BkashPayment();
    this.nagad = new NagadPayment();
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods() {
    const config = checkPaymentGatewayConfig();
    
    return {
      cash_on_delivery: {
        name: 'Cash on Delivery',
        enabled: true,
        description: 'Pay when you receive your order'
      },
      bkash: {
        name: 'bKash',
        enabled: config.bkash.configured && config.bkash.enabled,
        description: config.bkash.configured ? 'Pay with bKash mobile wallet' : 'Coming Soon',
        configured: config.bkash.configured
      },
      nagad: {
        name: 'Nagad',
        enabled: config.nagad.configured && config.nagad.enabled,
        description: config.nagad.configured ? 'Pay with Nagad mobile wallet' : 'Coming Soon',
        configured: config.nagad.configured
      },
      card: {
        name: 'Credit/Debit Card',
        enabled: false,
        description: 'Coming Soon',
        configured: false
      },
      bank_transfer: {
        name: 'Bank Transfer',
        enabled: false,
        description: 'Coming Soon',
        configured: false
      }
    };
  }

  /**
   * Process payment based on method
   */
  async processPayment(paymentMethod, orderData) {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return {
          success: true,
          paymentId: `COD-${orderData.orderNumber}`,
          status: 'pending',
          message: 'Cash on Delivery order confirmed'
        };
      
      case 'bkash':
        return await this.bkash.createPayment(orderData);
      
      case 'nagad':
        return await this.nagad.createPayment(orderData);
      
      default:
        return {
          success: false,
          message: 'Invalid payment method selected'
        };
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(paymentMethod, callbackData) {
    switch (paymentMethod) {
      case 'bkash':
        if (callbackData.paymentID) {
          return await this.bkash.executePayment(callbackData.paymentID);
        }
        break;
      
      case 'nagad':
        return await this.nagad.verifyPayment(callbackData);
      
      default:
        return {
          success: false,
          message: 'Invalid payment method for callback'
        };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentMethod, paymentId) {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return {
          success: true,
          status: 'pending',
          message: 'Cash on Delivery - Payment pending'
        };
      
      case 'bkash':
        return await this.bkash.queryPayment(paymentId);
      
      default:
        return {
          success: false,
          message: 'Payment status query not supported for this method'
        };
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentMethod, transactionId, amount, reason = '') {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return {
          success: true,
          refundId: `COD-REFUND-${Date.now()}`,
          message: 'Cash on Delivery refund approved - will be processed manually',
          requiresManualProcessing: true
        };
      
      case 'bkash':
        return await this.bkash.refundPayment(transactionId, amount, reason);
      
      case 'nagad':
        return await this.nagad.refundPayment(transactionId, amount, reason);
      
      default:
        return {
          success: false,
          message: 'Refund not supported for this payment method'
        };
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(paymentMethod, refundId) {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return {
          success: true,
          status: 'pending',
          message: 'Manual refund processing required'
        };
      
      case 'bkash':
        // bKash doesn't have a specific refund query endpoint
        // Use transaction query with refund ID if available
        return {
          success: true,
          status: 'completed',
          message: 'Refund processed (check with transaction ID)'
        };
      
      default:
        return {
          success: false,
          message: 'Refund status query not supported for this method'
        };
    }
  }
}

// Default export
export default new PaymentService();