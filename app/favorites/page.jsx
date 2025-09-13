'use client'
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const FavoritesPage = () => {
  const { user, getToken } = useAppContext();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoriteProducts = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const token = await getToken();
      const response = await axios.get('/api/user/favorites/products', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setFavoriteProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch favorite products:', error);
      toast.error('Failed to load favorite products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [user]);

  if (!user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 md:px-16 lg:px-32 bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black">
          <div className="text-center">
            <div className="mb-8">
              <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 animate-pulse-glow">
              Sign in to view favorites
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Create an account or sign in to save your favorite products and access them anytime.
            </p>
            <button 
              onClick={() => window.location.href = '/sign-in'}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 md:px-16 lg:px-32 bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading your favorites...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start px-6 md:px-16 lg:px-32 bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black min-h-screen">
        <div className="flex flex-col items-end pt-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white animate-pulse-glow">
            My Favorites
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full animate-gradient mt-2"></div>
        </div>
        
        {favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-20">
            <div className="text-center">
              <div className="mb-8">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                No favorites yet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                Start exploring our products and click the heart icon to save your favorites here.
              </p>
              <button 
                onClick={() => window.location.href = '/all-products'}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Browse Products
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-8">
              {favoriteProducts.length} item{favoriteProducts.length !== 1 ? 's' : ''} in your favorites
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
              {favoriteProducts.map((product, index) => (
                <div key={product._id} className="animate-float-delay-1 hover:scale-105 transition-transform duration-300">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default FavoritesPage;