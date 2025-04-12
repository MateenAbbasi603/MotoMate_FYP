import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

export default function page() {
  return (
    <div>Your Orders Will Appear Here <Link href={"/orders/new"} className={buttonVariants()}>Create New Order</Link></div>
  )
}
