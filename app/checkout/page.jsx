'use client'

import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from 'react-hot-toast';
import axios from "axios";
import Image from "next/image";
import { 
  calculateOrderTotal, 
  validateOrderData, 
  convertCartToOrderItems,
  isDhakaAddress,
  DELIVERY_CHARGES 
} from "@/lib/orderCalculations";

const CheckoutPage = () => {
  const { 
    user, getToken, currency, router,
    products, userData, cartItems, 
    getCartCount, getCartAmount,
    updateCartQuantity 
  } = useAppContext();

  // State management
  const [loading, setLoading] = useState(false);
  const [orderCalculation, setOrderCalculation] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Payment and delivery state
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Product customization state for each item
  const [itemCustomizations, setItemCustomizations] = useState({});

  // Convert cart to order items
  const orderItems = convertCartToOrderItems(cartItems, products);

  // Initialize customer info from user data
  useEffect(() => {
    if (userData) {
      setCustomerInfo({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.contact || '',
        address: userData.address || ''
      });
    }
  }, [userData]);

  // Calculate order total whenever relevant data changes
  useEffect(() => {
    if (orderItems.length > 0 && customerInfo.address) {
      const calculation = calculateOrderTotal(orderItems, customerInfo.address, promoCode);
      setOrderCalculation(calculation);
    }
  }, [orderItems, customerInfo.address, promoCode]);

  // Redirect if cart is empty or user not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please login to access checkout');
      router.push('/');
      return;
    }
    
    if (getCartCount() === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }
  }, [user, getCartCount, router]);

  const handleCustomizationChange = (itemKey, field, value) => {
    setItemCustomizations(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value
      }
    }));
  };

  const handleQuantityChange = async (itemKey, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Extract variant info from key for updateCartQuantity
    const parts = itemKey.split('_');
    const productId = parts[0];
    const color = parts[1] || 'default';
    const size = parts[2] || 'default';
    
    await updateCartQuantity(productId, newQuantity, { color, size });
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    // The calculation will be updated automatically through useEffect
    setTimeout(() => {
      setApplyingPromo(false);
      if (orderCalculation?.calculation?.discount?.isValid) {
        toast.success(orderCalculation.calculation.discount.message);
      } else {
        toast.error(orderCalculation?.calculation?.discount?.message || 'Invalid promo code');
      }
    }, 500);
  };

  const removePromoCode = () => {
    setPromoCode('');
    toast.success('Promo code removed');
  };

  const handleFileUpload = async (itemKey, file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'dtf_drop_designs'); // You'll need to set this in Cloudinary

      toast.loading('Uploading design...', { id: 'upload' });
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        handleCustomizationChange(itemKey, 'customDesignUrl', data.secure_url);
        handleCustomizationChange(itemKey, 'hasCustomDesign', true);
        toast.success('Design uploaded successfully!', { id: 'upload' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload design. Please try again.', { id: 'upload' });
    }
  };

  const submitOrder = async () => {
    if (!orderCalculation || !orderCalculation.success) {
      toast.error('Please fix order calculation errors before proceeding');
      return;
    }

    // Prepare order items with customizations
    const finalOrderItems = orderItems.map(item => {
      const itemKey = `${item.productId}_${item.color}_${item.size}`;
      const customization = itemCustomizations[itemKey] || {};
      
      return {
        ...item,
        customization: {
          hasCustomDesign: customization.hasCustomDesign || false,
          customDesignUrl: customization.customDesignUrl || '',
          customText: customization.customText || '',
          customNumber: customization.customNumber || '',
          customSlogan: customization.customSlogan || '',
          specialInstructions: customization.specialInstructions || ''
        }
      };
    });

    const orderData = {
      customerInfo,
      items: finalOrderItems,
      pricing: {
        subtotal: orderCalculation.calculation.subtotal,
        deliveryCharge: orderCalculation.calculation.deliveryCharge,
        discountAmount: orderCalculation.calculation.discountAmount,
        promoCode: promoCode || null,
        totalAmount: orderCalculation.calculation.totalAmount
      },
      delivery: {
        address: customerInfo.address,
        isDhaka: orderCalculation.calculation.delivery.isDhaka,
        deliveryCharge: orderCalculation.calculation.deliveryCharge,
        deliveryNotes
      },
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      giftInfo: {
        isGift,
        giftMessage: isGift ? giftMessage : '',
        recipientName: isGift ? recipientName : ''
      }
    };

    // Validate order data
    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      toast.error(`Order validation failed: ${validation.errors[0]}`);
      return;
    }

    setLoading(true);
    
    try {
      const token = await getToken();
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        router.push(`/order-placed?orderId=${response.data.order._id}`);
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please log in to access the checkout page.</p>
        </div>
      </div>
    );
  }

  if (getCartCount() === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Cart Empty</h2>
          <p>Please add items to your cart before checkout.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Product Selection Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                🛒 <span className="ml-2">Order Items ({getCartCount()} items)</span>
              </h2>
              
              <div className="space-y-6">
                {orderItems.map((item, index) => {
                  const itemKey = `${item.productId}_${item.color}_${item.size}`;
                  const product = products.find(p => p._id === item.productId);
                  
                  return (
                    <div key={itemKey} className="border-b pb-6 last:border-b-0">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Product Image */}
                        <div className="w-full md:w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.productImage || product?.images?.[0] || '/placeholder-image.jpg'}
                            alt={item.productName}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.productName}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded mr-2">
                              Color: {item.color}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded">
                              Size: {item.size}
                            </span>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center mt-3">
                            <span className="text-sm text-gray-600 mr-3">Qty:</span>
                            <button
                              onClick={() => handleQuantityChange(itemKey, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="mx-3 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(itemKey, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-semibold">{currency}{item.totalPrice}</p>
                          <p className="text-sm text-gray-600">{currency}{item.unitPrice} each</p>
                        </div>
                      </div>
                      
                      {/* Customization Section */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Customize This Item</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Custom Design Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload Custom Design
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(itemKey, e.target.files[0])}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {itemCustomizations[itemKey]?.customDesignUrl && (
                              <p className="text-xs text-green-600 mt-1">✓ Design uploaded successfully</p>
                            )}
                          </div>
                          
                          {/* Custom Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Text
                            </label>
                            <input
                              type="text"
                              placeholder="Enter custom text..."
                              value={itemCustomizations[itemKey]?.customText || ''}
                              onChange={(e) => handleCustomizationChange(itemKey, 'customText', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* Custom Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter number..."
                              value={itemCustomizations[itemKey]?.customNumber || ''}
                              onChange={(e) => handleCustomizationChange(itemKey, 'customNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {/* Custom Slogan */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Slogan
                            </label>
                            <input
                              type="text"
                              placeholder="Enter slogan..."
                              value={itemCustomizations[itemKey]?.customSlogan || ''}
                              onChange={(e) => handleCustomizationChange(itemKey, 'customSlogan', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Special Instructions */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Instructions
                          </label>
                          <textarea
                            placeholder="Any special instructions for this item..."
                            value={itemCustomizations[itemKey]?.specialInstructions || ''}
                            onChange={(e) => handleCustomizationChange(itemKey, 'specialInstructions', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                👤 <span className="ml-2">Customer Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  required
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  placeholder="Enter your complete delivery address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {customerInfo.address && (
                  <p className="text-xs text-blue-600 mt-1">
                    Delivery Zone: {isDhakaAddress(customerInfo.address) ? 'Inside Dhaka' : 'Outside Dhaka'} 
                    ({currency}{isDhakaAddress(customerInfo.address) ? DELIVERY_CHARGES.INSIDE_DHAKA : DELIVERY_CHARGES.OUTSIDE_DHAKA})
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Gift Options */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                💳 <span className="ml-2">Payment & Additional Options</span>
              </h2>
              
              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Payment Method</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>Cash on Delivery (COD)</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={paymentMethod === 'bkash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>bKash - Mobile Payment {process.env.BKASH_API_KEY ? '' : '(Configuration Required)'}</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="nagad"
                      checked={paymentMethod === 'nagad'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>Nagad - Mobile Payment {process.env.NAGAD_MERCHANT_ID ? '' : '(Configuration Required)'}</span>
                  </label>
                </div>
              </div>
              
              {/* Gift Option */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="mr-3"
                  />
                  <span>This is a gift</span>
                </label>
                
                {isGift && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gift Message
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        rows={3}
                        placeholder="Write a gift message..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special delivery instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                ✅ <span className="ml-2">Order Summary</span>
              </h2>
              
              {orderCalculation && orderCalculation.success ? (
                <div className="space-y-4">
                  {/* Items Summary */}
                  <div className="border-b pb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {orderCalculation.calculation.summary.itemsCount} items, {orderCalculation.calculation.summary.totalQuantity} pieces
                    </p>
                    <div className="text-sm space-y-1">
                      {orderCalculation.calculation.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate">{item.productId.substring(0, 20)}...</span>
                          <span>{currency}{item.totalPrice}</span>
                        </div>
                      ))}
                      {orderCalculation.calculation.items.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{orderCalculation.calculation.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currency}{orderCalculation.calculation.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery ({orderCalculation.calculation.delivery.zone}):</span>
                      <span>{currency}{orderCalculation.calculation.deliveryCharge}</span>
                    </div>
                    {orderCalculation.calculation.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{currency}{orderCalculation.calculation.discountAmount}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Promo Code */}
                  <div className="border-t pt-4">
                    {orderCalculation.calculation.discount?.isValid ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700">
                          ✓ {orderCalculation.calculation.discount.description}
                        </span>
                        <button
                          onClick={removePromoCode}
                          className="text-red-500 text-sm underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={applyPromoCode}
                            disabled={applyingPromo || !promoCode.trim()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {applyingPromo ? '...' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-2xl">{currency}{orderCalculation.calculation.totalAmount}</span>
                    </div>
                  </div>
                  
                  {/* Place Order Button */}
                  <button
                    onClick={submitOrder}
                    disabled={loading || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Placing Order...' : `Place Order - ${currency}${orderCalculation.calculation.totalAmount}`}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Loading order summary...</p>
                  <p className="text-sm mt-2">Please ensure delivery address is entered</p>
                </div>
              )}
              
              {/* Security Notice */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  🔒 Your information is secure and encrypted. We never store your payment details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;