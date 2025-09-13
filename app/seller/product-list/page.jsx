'use client'
import React, { useEffect, useState } from "react";
import { assets, productsDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ProductList = () => {
  const { router, getToken, user } = useAppContext()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingProduct, setDeletingProduct] = useState(null)

  const fetchSellerProduct = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/product/seller-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setProducts(data.products);
        setLoading(false);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch products");
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingProduct(productId);
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/product/delete?id=${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        toast.success('Product deleted successfully!');
        // Remove the deleted product from the state
        setProducts(products.filter(product => product._id !== productId));
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingProduct(null);
    }
  }

  useEffect(() => {
    if (user) {
      fetchSellerProduct();
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your product inventory</p>
            </div>
            <button
              onClick={() => router.push('/seller')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Product
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Products</h2>
              <p className="mt-1 text-sm text-gray-600">
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {/* Mobile Card View (hidden on md and up) */}
            <div className="md:hidden space-y-4 p-4">
              {products.map((product, index) => (
                <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <Image
                          className="h-16 w-16 rounded-lg object-cover"
                          src={product.images[0]}
                          alt={product.name}
                          width={64}
                          height={64}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-600">No img</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {product.gender}
                        </span>
                      </div>
                      <div className="mt-2">
                        {product.offerPrice ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-green-600">${product.offerPrice}</span>
                            <span className="text-xs text-gray-500 line-through">${product.price}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">${product.price}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="flex text-yellow-400 text-xs">
                            {'★'.repeat(Math.floor(product.ratings || 0))}
                            {'☆'.repeat(5 - Math.floor(product.ratings || 0))}
                          </div>
                          <span className="text-xs text-gray-500">({product.numOfReviews || 0})</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/seller/edit-product/${product._id}`)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/product/${product._id}`)}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs hover:bg-green-100 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={deletingProduct === product._id}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deletingProduct === product._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Design Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.images && product.images[0] ? (
                              <Image
                                className="h-10 w-10 rounded-full object-cover"
                                src={product.images[0]}
                                alt={product.name}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-600">No img</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.colors?.join(', ')} | {product.sizes?.join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="capitalize">{product.gender}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.designType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {product.offerPrice ? (
                            <>
                              <span className="text-green-600 font-semibold">
                                ${product.offerPrice}
                              </span>
                              <span className="text-gray-500 line-through ml-2 text-sm">
                                ${product.price}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold">${product.price}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex text-yellow-400 text-sm">
                            {'★'.repeat(Math.floor(product.ratings || 0))}
                            {'☆'.repeat(5 - Math.floor(product.ratings || 0))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            ({product.numOfReviews || 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/seller/edit-product/${product._id}`)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/product/${product._id}`)}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md hover:bg-green-100 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={deletingProduct === product._id}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deletingProduct === product._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No products found</div>
                <button
                  onClick={() => router.push('/seller')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductList;