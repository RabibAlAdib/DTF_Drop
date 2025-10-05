'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";

const Cart = () => {
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const { products, router, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();

  return (
    <>
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
            {/* Gift Option UI */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <label className="flex items-center gap-2 font-medium text-yellow-800">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={e => setIsGift(e.target.checked)}
                  className="accent-orange-600"
                />
                Order as a Gift
              </label>
              {isGift && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Gift Message</label>
                    <input
                      type="text"
                      value={giftMessage}
                      onChange={e => setGiftMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none"
                      placeholder="Write a message for the recipient"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded focus:outline-none"
                      placeholder="Recipient's name"
                    />
                  </div>
                </div>
              )}
            </div>
          <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
            <p className="text-2xl md:text-3xl text-gray-500">
              Your <span className="font-medium text-orange-600">Cart</span>
            </p>
            <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-left">
                <tr>
                  <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Product Details
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Price
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Quantity
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(cartItems).map((itemKey) => {
                  // Skip the _variants key
                  if (itemKey === '_variants' || cartItems[itemKey] <= 0) return null;
                  
                  // Extract base product ID from variant key (format: productId_color_size or productId)
                  const baseProductId = itemKey.split('_')[0];
                  const product = products.find(product => product._id === baseProductId);
                  
                  // Get variant info if available
                  const variantInfo = cartItems._variants?.[itemKey] || {};

                  if (!product) return null;

                  return (
                    <tr key={itemKey}>
                      <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                        <div>
                          <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                            <Image
                              src={product.images?.[0] || '/placeholder-image.jpg'}
                              alt={product.name}
                              className="w-16 h-auto object-cover mix-blend-multiply"
                              width={1280}
                              height={720}
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                          <button
                            className="md:hidden text-xs text-orange-600 mt-1"
                            onClick={() => updateCartQuantity(baseProductId, 0, variantInfo)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-sm hidden md:block">
                          <p className="text-gray-800">{product.name}</p>
                          {variantInfo.color && (
                            <p className="text-xs text-gray-500">Color: {variantInfo.color}</p>
                          )}
                          {variantInfo.size && (
                            <p className="text-xs text-gray-500">Size: {variantInfo.size}</p>
                          )}
                          <button
                            className="text-xs text-orange-600 mt-1"
                            onClick={() => updateCartQuantity(baseProductId, 0, variantInfo)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">BDT {product.offerPrice || product.price}</td>
                      <td className="py-4 md:px-4 px-1">
                        <div className="flex items-center md:gap-2 gap-1">
                          <button onClick={() => updateCartQuantity(baseProductId, cartItems[itemKey] - 1, variantInfo)}>
                            <Image
                              src={assets.decrease_arrow}
                              alt="decrease_arrow"
                              className="w-4 h-4"
                            />
                          </button>
                          <input 
                            onChange={e => updateCartQuantity(baseProductId, Number(e.target.value), variantInfo)} 
                            type="number" 
                            value={cartItems[itemKey]} 
                            className="w-8 border text-center appearance-none"
                          />
                          <button onClick={() => addToCart(baseProductId, variantInfo)}>
                            <Image
                              src={assets.increase_arrow}
                              alt="increase_arrow"
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">BDT {((product.offerPrice || product.price) * cartItems[itemKey]).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={()=> router.push('/all-products')} className="group flex items-center mt-6 gap-2 text-orange-600">
            <Image
              className="group-hover:-translate-x-1 transition"
              src={assets.arrow_right_icon_colored}
              alt="arrow_right_icon_colored"
            />
            Continue Shopping
          </button>
          
        </div>
        <OrderSummary
          isGift={isGift}
          giftMessage={giftMessage}
          recipientName={recipientName}
        />
      </div>
    </>
  );
};

export default Cart;
