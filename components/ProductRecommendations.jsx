'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import axios from 'axios'

const ProductRecommendations = ({ currentProductId, category }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(`/api/product/recommendations?category=${category}&exclude=${currentProductId}`)
        setProducts(response.data)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (category && currentProductId) {
      fetchRecommendations()
    }
  }, [category, currentProductId])

  if (loading) {
    return <div className="text-center py-8">Loading recommendations...</div>
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}

export default ProductRecommendations