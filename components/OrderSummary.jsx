import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const OrderSummary = () => {

  const { currency, router, getCartCount, getCartAmount, cartItems, products, userData, user, getToken, setCartItems } = useAppContext()
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery');
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('/api/user/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserAddresses(response.data.addresses);
        // Auto-select default address
        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress && !selectedAddress) {
          setSelectedAddress(defaultAddress);
        }
      } else {
        setUserAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setUserAddresses([]);
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
    // Calculate delivery charge based on address
    calculateDeliveryCharge(address);
  };

  const calculateDeliveryCharge = (address) => {
    if (!address) return;
    
    const addressLower = `${address.area} ${address.city} ${address.state}`.toLowerCase();
    const isDhaka = addressLower.includes('dhaka');
    const charge = isDhaka ? 70 : 130;
    setDeliveryCharge(charge);
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    try {
      // First check if it's a dynamic offer from database
      const response = await axios.post('/api/promo/validate', {
        promoCode: promoCode.trim()
      });

      if (response.data.success && response.data.offer) {
        // It's a dynamic offer
        const offer = response.data.offer;
        const subtotal = getCartAmount();
        
        if (subtotal < offer.minimumOrderValue) {
          toast.error(`Minimum order of ${currency}${offer.minimumOrderValue} required for this promo code`);
          return;
        }

        let discountAmount = 0;
        if (offer.discountType === 'percentage') {
          discountAmount = (subtotal * offer.discountValue) / 100;
        } else if (offer.discountType === 'fixed') {
          discountAmount = offer.discountValue;
        }

        discountAmount = Math.min(discountAmount, subtotal);

        setAppliedPromo({
          code: offer.offerCode,
          description: offer.title,
          discountAmount: discountAmount
        });
        setPromoDiscount(discountAmount);
        toast.success(`${offer.title} applied! You saved ${currency}${discountAmount}`);
      } else {
        // Check hardcoded promo codes
        const subtotal = getCartAmount();
        
        // Import calculateDiscount function dynamically for hardcoded codes
        const { calculateDiscount } = await import('@/lib/orderCalculations');
        const discountResult = calculateDiscount(subtotal, promoCode);

        if (discountResult.isValid) {
          setAppliedPromo({
            code: discountResult.promoCode,
            description: discountResult.description,
            discountAmount: discountResult.discountAmount
          });
          setPromoDiscount(discountResult.discountAmount);
          toast.success(discountResult.message);
        } else {
          toast.error(discountResult.message);
        }
      }
    } catch (error) {
      // If API call fails, try hardcoded codes
      try {
        const subtotal = getCartAmount();
        const { calculateDiscount } = await import('@/lib/orderCalculations');
        const discountResult = calculateDiscount(subtotal, promoCode);

        if (discountResult.isValid) {
          setAppliedPromo({
            code: discountResult.promoCode,
            description: discountResult.description,
            discountAmount: discountResult.discountAmount
          });
          setPromoDiscount(discountResult.discountAmount);
          toast.success(discountResult.message);
        } else {
          toast.error(discountResult.message);
        }
      } catch (calcError) {
        console.error('Promo code validation error:', calcError);
        toast.error('Failed to validate promo code');
      }
    }
  };

  const createOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      router.push('/sign-in');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (getCartCount() === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      // Convert cart items to order format
      const orderItems = Object.keys(cartItems)
        .filter(itemKey => itemKey !== '_variants' && cartItems[itemKey] > 0)
        .map(itemKey => {
          const baseProductId = itemKey.split('_')[0];
          const product = products.find(p => p._id === baseProductId);
          const variantInfo = cartItems._variants?.[itemKey] || {};
          const quantity = cartItems[itemKey];
          
          if (!product) {
            throw new Error(`Product not found for item: ${itemKey}`);
          }

          const unitPrice = product.offerPrice || product.price;
          
          return {
            productId: baseProductId,
            productName: product.name,
            color: variantInfo.color || 'Default',
            size: variantInfo.size || 'Default',
            unitPrice: unitPrice,
            quantity: quantity,
            totalPrice: unitPrice * quantity,
            productImage: product.images?.[0] || product.image
          };
        });

      // Prepare customer info
      const customerInfo = {
        name: userData?.name || user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: userData?.email || user?.primaryEmailAddress?.emailAddress,
        phone: selectedAddress.phoneNumber || userData?.phone || '',
        address: `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.pinCode || ''}`
      };

      // Validate required fields
      if (!customerInfo.name || customerInfo.name.trim().length < 2) {
        toast.error('Valid customer name is required');
        return;
      }
      if (!customerInfo.email || !/\S+@\S+\.\S+/.test(customerInfo.email)) {
        toast.error('Valid email address is required');
        return;
      }
      if (!customerInfo.phone || customerInfo.phone.trim().length < 10) {
        toast.error('Valid phone number is required (minimum 10 digits)');
        return;
      }

      // Prepare order data
      const orderData = {
        customerInfo,
        items: orderItems,
        payment: {
          method: selectedPaymentMethod
        },
        delivery: {
          address: customerInfo.address,
          notes: ''
        },
        promoCode: appliedPromo?.code || '',
        discountAmount: promoDiscount || 0
      };

      // Create order
      const token = await getToken();
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        // Clear applied promo
        setAppliedPromo(null);
        setPromoDiscount(0);
        setPromoCode('');
        
        // Clear cart items from context
        setCartItems({});
        
        // Redirect to success page
        router.push(`/order-placed?orderNumber=${response.data.order.orderNumber}`);
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    }
  }

  const generateCartMessage = () => {
    const cartDetails = Object.keys(cartItems)
      .filter(itemKey => itemKey !== '_variants' && cartItems[itemKey] > 0)
      .map(itemKey => {
        const baseProductId = itemKey.split('_')[0];
        const product = products.find(p => p._id === baseProductId);
        const variantInfo = cartItems._variants?.[itemKey] || {};
        const quantity = cartItems[itemKey];
        const price = product?.offerPrice || product?.price || 0;
        
        if (!product) return null;
        
        let productText = `• ${product.name} - Qty: ${quantity} - $${price} each`;
        if (variantInfo.color) productText += ` (Color: ${variantInfo.color})`;
        if (variantInfo.size) productText += ` (Size: ${variantInfo.size})`;
        
        return productText;
      })
      .filter(Boolean)
      .join('\n');
      
    const totalAmount = getCartAmount();
    
    return `Hi! I'm interested in these items from DTF Drop:\n\n${cartDetails}\n\nTotal: $${totalAmount}\n\nCan you help me with the order?`;
  }

  const handleContactSupport = () => {
    const message = generateCartMessage();
    const phoneNumber = '+8801344823831';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user])

  useEffect(() => {
    if (selectedAddress) {
      calculateDeliveryCharge(selectedAddress);
    }
  }, [selectedAddress])

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-200">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 dark:text-gray-300 block mb-2">
            Select Address
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border dark:border-gray-600 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Select Address"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 dark:hover:bg-gray-700 cursor-pointer text-center text-gray-700 dark:text-gray-200"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 dark:text-gray-300 block mb-2">
            Promo Code
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 border dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button onClick={handleApplyPromo} className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Apply
            </button>
            {appliedPromo && (
              <div className="w-full p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✓ {appliedPromo.description} applied! Saving {currency}{promoDiscount}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 dark:text-gray-300 block mb-2">
            Payment Method
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input 
                type="radio" 
                id="cash_on_delivery" 
                name="payment_method" 
                value="cash_on_delivery"
                checked={selectedPaymentMethod === 'cash_on_delivery'}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="mr-3 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="cash_on_delivery" className="text-gray-700 dark:text-gray-200 cursor-pointer">
                💵 Cash on Delivery
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                id="bkash" 
                name="payment_method" 
                value="bkash"
                checked={selectedPaymentMethod === 'bkash'}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="mr-3 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="bkash" className="text-gray-700 dark:text-gray-200 cursor-pointer">
                📱 bKash
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                id="nagad" 
                name="payment_method" 
                value="nagad"
                checked={selectedPaymentMethod === 'nagad'}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="mr-3 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="nagad" className="text-gray-700 dark:text-gray-200 cursor-pointer disable">
                💳 Nagad
              </label>
            </div>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600 dark:text-gray-300">Items {getCartCount()}</p>
            <p className="text-gray-800 dark:text-gray-200">{currency}{getCartAmount()}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600 dark:text-gray-300">Delivery Charge</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {deliveryCharge > 0 ? `${currency}${deliveryCharge}` : 'Select address'}
            </p>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <p>Promo Discount</p>
              <p className="font-medium">-{currency}{promoDiscount}</p>
            </div>
          )}
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p className="text-gray-800 dark:text-gray-200">Total</p>
            <p className="text-gray-800 dark:text-gray-200">{currency}{getCartAmount() - promoDiscount + deliveryCharge}</p>
          </div>
        </div>
      </div>

      <button onClick={createOrder} className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700">
        Place Order
      </button>
      
      {/* Contact Support via WhatsApp */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={handleContactSupport}
          className="w-full bg-green-600 text-white py-3 hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          Contact Support via WhatsApp
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Get instant help with your cart items
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;