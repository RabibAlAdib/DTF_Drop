import React, { useState } from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import CartModal from './CartModal';

const ProductCard = ({ product }) => {

    const { currency, router, user, favorites, isFavorite, addToFavorites, removeFromFavorites } = useAppContext()
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);

    const handleFavoriteToggle = async (e, productId) => {
        e.preventDefault(); // Prevent navigation to product page
        e.stopPropagation();
        
        if (!user) {
            toast.error('Please log in to add items to favorites');
            return;
        }

        // Use AppContext functions that handle both API calls and state updates
        if (isFavorite(productId)) {
            await removeFromFavorites(productId);
        } else {
            await addToFavorites(productId);
        }
    };

    const handleAddToCartClick = (e) => {
        e.preventDefault(); // Prevent navigation to product page
        e.stopPropagation();
        
        if (!user) {
            toast.error('Please log in to add items to cart');
            return;
        }
        
        setIsCartModalOpen(true);
    };

    return (
        <>
            <Link 
                href={`/product/${product._id}`}
                prefetch={true}
                className="flex flex-col items-start gap-0.5 w-full cursor-pointer px-2"
            >
                <div className="cursor-pointer group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl w-full h-48 md:h-56 overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700/50 group-hover:shadow-2xl group-hover:shadow-orange-500/20 dark:group-hover:shadow-purple-500/30 transition-all duration-500 group-hover:border-orange-300/50 dark:group-hover:border-purple-500/50">
                    {/* Professional background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-orange-400/5 group-hover:via-pink-400/5 group-hover:to-purple-400/5 transition-all duration-700"></div>
                    
                    <div className="relative w-full h-full p-4 pt-6">
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            className="group-hover:scale-105 transition-all duration-500 object-contain w-full h-full rounded-lg brightness-100 contrast-105 bg-white/80 dark:bg-gray-800/80 p-3 shadow-sm group-hover:shadow-md backdrop-blur-sm"
                            width={800}
                            height={800}
                        />
                    </div>
                    <button 
                        onClick={(e) => handleFavoriteToggle(e, product._id)}
                        className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg backdrop-blur-sm border transition-all duration-300 hover:scale-110 ${
                            isFavorite(product._id) 
                                ? 'bg-red-500/90 text-white hover:bg-red-600 border-red-400/50' 
                                : 'bg-white/90 text-gray-600 hover:bg-red-50 border-gray-200/50 hover:text-red-500'
                        }`}
                    >
                        <svg 
                            className="h-4 w-4" 
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

                <div className="px-2 pb-2">
                    <p className="md:text-base font-semibold pt-3 w-full truncate text-gray-900 dark:text-white">{product.name}</p>
                    <p className="w-full text-xs text-gray-600 dark:text-gray-400 max-sm:hidden mt-1 text-clamp-2">
                       {product.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs font-medium text-orange-600">{4.5}</p>
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
                        <span className="text-xs text-gray-500 ml-1">(128)</span>
                    </div>

                    <div className="flex items-center justify-between w-full mt-3">
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{currency}{product.offerPrice}</p>
                            {product.price !== product.offerPrice && (
                                <p className="text-sm text-gray-500 line-through">{currency}{product.price}</p>
                            )}
                        </div>
                        <button 
                            onClick={handleAddToCartClick}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 rounded-lg text-xs font-medium hover:from-orange-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </Link>
            
            {/* Cart Modal */}
            <CartModal 
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
                product={product}
            />
        </>
    );
};

export default ProductCard;