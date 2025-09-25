"use client";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import { toast } from "react-hot-toast";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    const statusOptions = [
        {
            value: "pending",
            label: "Pending",
            color: "bg-yellow-100 text-yellow-800",
        },
        {
            value: "processing",
            label: "Processing",
            color: "bg-blue-100 text-blue-800",
        },
        {
            value: "shipped",
            label: "Shipped",
            color: "bg-purple-100 text-purple-800",
        },
        {
            value: "delivered",
            label: "Delivered",
            color: "bg-green-100 text-green-800",
        },
        {
            value: "cancelled",
            label: "Cancelled",
            color: "bg-red-100 text-red-800",
        },
    ];

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/orders/seller", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setOrders(data.orders);
            } else {
                toast.error(data.message || "Failed to fetch orders");
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);
            toast.error("Failed to fetch orders. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdatingStatus(orderId);
            const token = await getToken();

            const { data } = await axios.put(
                "/api/orders/seller",
                {
                    orderId,
                    status: newStatus,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (data.success) {
                // Update the local orders state
                setOrders(
                    orders.map((order) =>
                        order._id === orderId
                            ? { ...order, status: newStatus }
                            : order,
                    ),
                );
                toast.success("Order status updated successfully");
            } else {
                toast.error(data.message || "Failed to update order status");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status. Please try again.");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusColor = (status) => {
        const statusOption = statusOptions.find(
            (option) => option.value === status,
        );
        return statusOption ? statusOption.color : "bg-gray-100 text-gray-800";
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    if (loading) return <Loading />;

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            <div className="md:p-10 p-4 space-y-5">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium">
                        All Orders ({orders.length})
                    </h2>
                    <button
                        onClick={fetchSellerOrders}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Image
                            src={assets.box_icon}
                            alt="No orders"
                            className="mx-auto mb-4 opacity-50"
                            width={64}
                            height={64}
                        />
                        <p>No orders found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <div
                                key={order._id || index}
                                className="border rounded-lg p-6 bg-white shadow-sm"
                            >
                                {/* Order Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            Order #{order.orderNumber}
                                        </h3>
                                        <p className="text-gray-600">
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleDateString()}{" "}
                                            at{" "}
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                                        <select
                                            value={order.status}
                                            onChange={(e) =>
                                                updateOrderStatus(
                                                    order._id,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                updatingStatus === order._id
                                            }
                                            className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)} ${
                                                updatingStatus === order._id
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "cursor-pointer"
                                            }`}
                                        >
                                            {statusOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="font-semibold text-lg text-green-600">
                                            {currency}
                                            {order.pricing.sellerTotal ||
                                                order.pricing.totalAmount}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="mb-4">
                                    <h4 className="font-medium mb-3">
                                        Items ({order.items.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {order.items.map((item, itemIndex) => (
                                            <div
                                                key={itemIndex}
                                                className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                                            >
                                                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                                                    {item.productImage ? (
                                                        <Image
                                                            src={
                                                                item.productImage
                                                            }
                                                            alt={
                                                                item.productName
                                                            }
                                                            className="w-full h-full object-cover rounded"
                                                            width={64}
                                                            height={64}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <span className="text-xs">
                                                                No Image
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {item.productName}
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-x-4">
                                                        <span>
                                                            Size:{" "}
                                                            <strong>
                                                                {item.size}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            Color:{" "}
                                                            <strong>
                                                                {item.color}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            Qty:{" "}
                                                            <strong>
                                                                {item.quantity}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            Price:{" "}
                                                            <strong>
                                                                {currency}
                                                                {item.unitPrice}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                    {item.hasCustomization && (
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            ✨ Has Custom Design
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        {currency}
                                                        {item.totalPrice}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer & Shipping Information */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Customer Information
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <p>
                                                <strong>Name:</strong>{" "}
                                                {order.customerInfo.name}
                                            </p>
                                            <p>
                                                <strong>Email:</strong>{" "}
                                                {order.customerInfo.email}
                                            </p>
                                            <p>
                                                <strong>Phone:</strong>{" "}
                                                {order.customerInfo.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Shipping Address
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <p>
                                                <strong>Name:</strong>{" "}
                                                {order.shippingAddress.fullName}
                                            </p>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {order.shippingAddress.address}
                                            </p>
                                            <p>
                                                <strong>City:</strong>{" "}
                                                {order.shippingAddress.city}
                                            </p>
                                            <p>
                                                <strong>Postal Code:</strong>{" "}
                                                {
                                                    order.shippingAddress
                                                        .postalCode
                                                }
                                            </p>
                                            <p>
                                                <strong>Phone:</strong>{" "}
                                                {order.shippingAddress.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment & Delivery Information */}
                                <div className="grid md:grid-cols-3 gap-6 mt-4 pt-4 border-t">
                                    <div className="space-y-1">
                                        <h4 className="font-medium">Payment</h4>
                                        <div className="text-sm">
                                            <p>
                                                <strong>Method:</strong>{" "}
                                                {order.payment.method.toUpperCase()}
                                            </p>
                                            <p>
                                                <strong>Status:</strong>{" "}
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${
                                                        order.payment.status ===
                                                        "paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {order.payment.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="font-medium">
                                            Delivery
                                        </h4>
                                        <div className="text-sm">
                                            <p>
                                                <strong>Method:</strong>{" "}
                                                {order.delivery.method}
                                            </p>
                                            <p>
                                                <strong>Fee:</strong> {currency}
                                                {order.delivery.fee}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="font-medium">
                                            Order Total
                                        </h4>
                                        <div className="text-sm">
                                            <p>
                                                <strong>Subtotal:</strong>{" "}
                                                {currency}
                                                {order.pricing.subtotal}
                                            </p>
                                            <p>
                                                <strong>Delivery:</strong>{" "}
                                                {currency}
                                                {order.pricing.deliveryCharge ||
                                                    order.pricing.deliveryFee}
                                            </p>
                                            {order.pricing.discountAmount >
                                                0 && (
                                                <p className="text-green-600">
                                                    <strong>
                                                        Discount Applied:
                                                    </strong>{" "}
                                                    -{currency}
                                                    {
                                                        order.pricing
                                                            .discountAmount
                                                    }
                                                    {order.pricing
                                                        .promoCode && (
                                                        <span className="text-xs ml-1">
                                                            (
                                                            {
                                                                order.pricing
                                                                    .promoCode
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                            <p>
                                                <strong>Total:</strong>{" "}
                                                <span className="font-semibold">
                                                    {currency}
                                                    {order.pricing
                                                        .totalAmount ||
                                                        order.pricing.subtotal +
                                                            (order.pricing
                                                                .deliveryCharge ||
                                                                order.pricing
                                                                    .deliveryFee) -
                                                            (order.pricing
                                                                .discountAmount ||
                                                                0)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Gift Information (if applicable) */}
                                {order.giftInfo && order.giftInfo.isGift && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="font-medium mb-2">
                                            🎁 Gift Information
                                        </h4>
                                        <div className="text-sm space-y-1 bg-pink-50 p-3 rounded">
                                            <p>
                                                <strong>Gift Message:</strong>{" "}
                                                {order.giftInfo.message}
                                            </p>
                                            <p>
                                                <strong>Recipient:</strong>{" "}
                                                {order.giftInfo.recipientName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Orders;
