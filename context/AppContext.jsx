'use client'
import { productsDummyData, userDummyData } from "@/assets/assets";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs"
import { toast } from 'react-hot-toast';
import axios from "axios";

export const AppContext = createContext();
export const useAppContext = () => {
  return useContext(AppContext)
}

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY
  const router = useRouter()
  const { user } = useUser()
  const { getToken } = useAuth()
  const [products, setProducts] = useState([])
  const [userData, setUserData] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [cartItems, setCartItems] = useState({})
  const [favorites, setFavorites] = useState([])

  const fetchProductData = async () => {
    // setProducts(productsDummyData)
    try {
      const { data } = await axios.get('/api/product/list')
      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error(data.message || "Failed to fetch product data")
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchUserData = async () => {
    try {
      if (user && user.publicMetadata && user.publicMetadata.role === 'seller') {
        setIsSeller(true)
      }
      const token = await getToken()
      const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        setUserData(data.user)
        setCartItems(data.user.cartItems)
      } else {
        toast.error(data.message || "Failed to fetch user data")
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Previous addToCart function (commented for reference)
  /*
  const addToCart = async (itemId) => {
    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
  }
  */

  // Updated addToCart function with variant support
  const addToCart = async (itemId, variant = {}, quantity = 1) => {
    let cartData = structuredClone(cartItems);
    
    // Create unique key for product variant
    const variantKey = variant.color && variant.size 
      ? `${itemId}_${variant.color}_${variant.size}`
      : itemId;
    
    if (cartData[variantKey]) {
      cartData[variantKey] += quantity;
    } else {
      cartData[variantKey] = quantity;
    }
    
    // Store variant info with the cart item
    if (!cartData._variants) {
      cartData._variants = {};
    }
    cartData._variants[variantKey] = variant;
    
    setCartItems(cartData);
  }

  // Previous updateCartQuantity function (commented for reference)
  /*
  const updateCartQuantity = async (itemId, quantity) => {
    let cartData = structuredClone(cartItems);
    if (quantity === 0) {
      delete cartData[itemId];
    } else {
      cartData[itemId] = quantity;
    }
    setCartItems(cartData)
  }
  */

  // Updated updateCartQuantity function with variant support
  const updateCartQuantity = async (itemId, quantity, variant = {}) => {
    let cartData = structuredClone(cartItems);
    
    const variantKey = variant.color && variant.size 
      ? `${itemId}_${variant.color}_${variant.size}`
      : itemId;
    
    if (quantity === 0) {
      delete cartData[variantKey];
      if (cartData._variants && cartData._variants[variantKey]) {
        delete cartData._variants[variantKey];
      }
    } else {
      cartData[variantKey] = quantity;
    }
    
    setCartItems(cartData)
  }

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      if (cartItems[items] > 0 && items !== '_variants') {
        totalCount += cartItems[items];
      }
    }
    return totalCount;
  }

  // Previous getCartAmount function (commented for reference)
  /*
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (cartItems[items] > 0) {
        totalAmount += itemInfo.offerPrice * cartItems[items];
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  }
  */

  // Updated getCartAmount function with variant support
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemKey in cartItems) {
      if (cartItems[itemKey] > 0 && itemKey !== '_variants') {
        // Extract base product ID from variant key
        const baseProductId = itemKey.split('_')[0];
        let itemInfo = products.find((product) => product._id === baseProductId);
        
        if (itemInfo) {
          const price = itemInfo.offerPrice || itemInfo.price;
          totalAmount += price * cartItems[itemKey];
        }
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  }

  // Add to favorites
  const addToFavorites = (productId) => {
    if (!user) {
      toast.error('Please log in to add items to favorites');
      return;
    }
    if (!favorites.includes(productId)) {
      setFavorites([...favorites, productId]);
      toast.success('Added to favorites!');
    }
  }

  // Remove from favorites
  const removeFromFavorites = (productId) => {
    if (!user) {
      toast.error('Please log in to manage favorites');
      return;
    }
    setFavorites(favorites.filter(id => id !== productId));
    toast.success('Removed from favorites!');
  }

  // Check if product is in favorites
  const isFavorite = (productId) => {
    if (!user) return false;
    return favorites.includes(productId);
  }

  useEffect(() => {
    fetchProductData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
    fetchUserData()
  }, [user])

  const value = {
    user, getToken,
    currency, router,
    isSeller, setIsSeller,
    userData, fetchUserData,
    products, fetchProductData,
    cartItems, setCartItems,
    addToCart, updateCartQuantity,
    getCartCount, getCartAmount,
    favorites, addToFavorites, removeFromFavorites, isFavorite
  }

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  )
}