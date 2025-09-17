import React from 'react';
import Link from 'next/link';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const SideBar = () => {
    const pathname = usePathname();
    const { user } = useUser();
    
    const menuItems = [
        { name: 'Add Product', path: '/seller', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Add Offer', path: '/seller/add-offer', icon: assets.add_icon },
        { name: 'Offer List', path: '/seller/offer-list', icon: assets.product_list_icon },
        { name: 'Header Slider', path: '/seller/header-slider', icon: assets.menu_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
        { name: 'Customization Admin', path: '/seller/customization-admin', icon: assets.menu_icon },
    ];

    // Add admin button only for dtfdrop_admin user
    if (user?.username === 'dtfdrop_admin') {
        menuItems.push({ 
            name: 'System Admin', 
            path: '/admin', 
            icon: assets.admin_icon || assets.menu_icon,
            isAdmin: true
        });
    }

    return (
        <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-300 dark:border-gray-600 py-2 flex flex-col bg-white dark:bg-gray-900'>
            {menuItems.map((item) => {

                const isActive = pathname === item.path;

                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div
                            className={
                                `flex items-center py-3 px-4 gap-3 ${isActive
                                    ? "border-r-4 md:border-r-[6px] bg-orange-600/10 border-orange-500/90"
                                    : item.isAdmin 
                                        ? "hover:bg-red-100/90 dark:hover:bg-red-900/20 border-white dark:border-gray-900"
                                        : "hover:bg-gray-100/90 dark:hover:bg-gray-800/90 border-white dark:border-gray-900"
                                }`
                            }
                        >
                            <Image
                                src={item.icon}
                                alt={`${item.name.toLowerCase()}_icon`}
                                className="w-7 h-7 dark:filter dark:brightness-0 dark:invert"
                            />
                            <p className={`md:block hidden text-center ${
                                item.isAdmin 
                                    ? 'text-red-600 dark:text-red-400 font-semibold' 
                                    : 'text-gray-900 dark:text-white'
                            }`}>
                                {item.name}
                                {item.isAdmin && <span className="text-xs block text-red-500">Admin Only</span>}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default SideBar;
