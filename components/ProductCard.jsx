import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product }) => {

    const { currency, router, user, favorites, isFavorite, getToken } = useAppContext()

    const handleFavoriteToggle = async (e, productId) => {
        e.preventDefault(); // Prevent navigation to product page
        e.stopPropagation();
        
        if (!user) {
            toast.error('Please log in to add items to favorites');
            return;
        }

        try {
            const token = await getToken();
            const action = isFavorite(productId) ? 'remove' : 'add';
            
            const response = await axios.post('/api/user/favorites', {
                productId,
                action
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                // Update local state through context
                if (action === 'add') {
                    // addToFavorites will be called via API success
                    toast.success('Added to favorites!');
                } else {
                    // removeFromFavorites will be called via API success
                    toast.success('Removed from favorites!');
                }
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Favorite toggle error:', error);
            toast.error('Failed to update favorites');
        }
    };

    return (
        <Link 
            href={`/product/${product._id}`}
            prefetch={true}
            className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer px-[5px]"
        >
            <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center">
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
                    width={800}
                    height={800}
                />
                <button 
                    onClick={(e) => handleFavoriteToggle(e, product._id)}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-300 hover:scale-110 ${
                        isFavorite(product._id) 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-white text-gray-600 hover:bg-red-50'
                    }`}
                >
                    <svg 
                        className="h-3 w-3" 
                        fill={isFavorite(product._id) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                        />
                    </svg>
                </button>
            </div>

            <p className="md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
            <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">{product.description}</p>
            <div className="flex items-center gap-2">
                <p className="text-xs">{4.5}</p>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Image
                            key={index}
                            className="h-3 w-3"
                            src={
                                index < Math.floor(4)
                                    ? assets.star_icon
                                    : assets.star_dull_icon
                            }
                            alt="star_icon"
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-medium">{currency}{product.offerPrice}</p>
                <button className=" max-sm:hidden px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition">
                    Buy now
                </button>
            </div>
        </Link>
    )
}

export default ProductCard