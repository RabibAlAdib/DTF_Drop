'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { assets } from '@/assets/assets'
import Image from 'next/image'

const OrderSuccess = () => {
  const searchParams = useSearchParams()
  const { router } = useAppContext()
  const orderNumber = searchParams.get('orderNumber')
  const success = searchParams.get('success')

  useEffect(() => {
    // Redirect to order-placed page after a short delay
    if (success && orderNumber) {
      setTimeout(() => {
        router.push(`/order-placed?orderNumber=${orderNumber}`)
      }, 1000)
    } else {
      // If no success params, redirect to my-orders
      router.push('/my-orders')
    }
  }, [success, orderNumber, router])

  if (success && orderNumber) {
    return (
      <div className='h-screen flex flex-col justify-center items-center gap-5'>
        <div className="flex justify-center items-center relative">
          <Image className="absolute p-5" src={assets.checkmark} alt='' />
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
        </div>
        <div className="text-center text-2xl font-semibold">Order Placed Successfully</div>
        <div className="text-center text-lg text-gray-600">Order Number: {orderNumber}</div>
        <div className="text-center text-sm text-gray-500">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="text-center text-2xl font-semibold">Redirecting to your orders...</div>
    </div>
  )
}

export default OrderSuccess