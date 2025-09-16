'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Orders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/orders/seller', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setOrders(data.orders);
            } else {
                toast.error(data.message || "Failed to fetch orders");
            }
        } catch (error) {
            console.error('Error fetching seller orders:', error);
            toast.error('Failed to fetch orders. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                <h2 className="text-lg font-medium">Orders</h2>
                <div className="max-w-4xl rounded-md">
                    {orders.map((order, index) => (
                        <div key={order._id || index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                            <div className="flex-1 flex gap-5 max-w-80">
                                <Image
                                    className="max-w-16 max-h-16 object-cover"
                                    src={assets.box_icon}
                                    alt="box_icon"
                                />
                                <p className="flex flex-col gap-3">
                                    <span className="font-medium">
                                        {order.items.map((item) => item.productName + ` x ${item.quantity}`).join(", ")}
                                    </span>
                                    <span>Items : {order.items.length}</span>
                                    <span className="text-sm text-gray-600">Order #{order.orderNumber}</span>
                                </p>
                            </div>
                            <div>
                                <p>
                                    <span className="font-medium">{order.customerInfo.name}</span>
                                    <br />
                                    <span>{order.customerInfo.phone}</span>
                                    <br />
                                    <span className="text-sm">{order.delivery.address}</span>
                                </p>
                            </div>
                            <p className="font-medium my-auto">{currency}{order.pricing.sellerTotal || order.pricing.totalAmount}</p>
                            <div>
                                <p className="flex flex-col">
                                    <span>Method : {order.payment.method.toUpperCase()}</span>
                                    <span>Date : {new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span>Payment : {order.payment.status}</span>
                                    <span className={`mt-1 px-2 py-1 text-xs rounded ${
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        Status: {order.status}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;