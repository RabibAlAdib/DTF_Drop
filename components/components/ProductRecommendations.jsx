'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const ProductRecommendations = ({ currentProductId, category }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(`/api/products/recommendations?category=${category}&exclude=${currentProductId}`)
        const data = await response.json()
        setRecommendations(data.slice(0, 4)) // Limit to 4 recommendations
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

  if (loading) return <div className="h-40 flex items-center justify-center">Loading recommendations...</div>
  if (recommendations.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {recommendations.map((product) => (
        <Link 
          key={product.id} 
          href={`/product/${product.id}`}
          className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="relative h-48 w-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium text-lg truncate">{product.name}</h3>
            <p className="text-gray-600 mt-1">${product.price.toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ProductRecommendations