"use client"
import React from "react";
import { BagIcon, BoxIcon, CartIcon, HomeIcon, assets} from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import {UserButton} from "@clerk/nextjs"
import ThemeToggle from './ThemeToggle';

const Navbar = () => {

  const { isSeller, router, user } = useAppContext();
  const {openSignIn} = useClerk();
  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white bg-white dark:bg-black transition-colors duration-300">
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push('/')}
        src={assets.logo}
        alt="logo"
      />
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
          Shop
        </Link>
        <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
          About Us
        </Link>
        <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
          Contact
        </Link>
        <Link href="/customization" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
          Customization
        </Link>

        {isSeller && <button onClick={() => router.push('/seller')} className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 px-4 py-1.5 rounded-full transition-colors">Seller Dashboard</button>}

      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <ThemeToggle />
        <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
        {user ? <>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
            </UserButton.MenuItems>
          </UserButton>
        </>
        :
        <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition">
          <Image src={assets.user_icon} alt="user icon" />
          Account
        </button>}
      </ul>

      <div className="flex items-center md:hidden gap-3">
        {isSeller && <button onClick={() => router.push('/seller')} className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 px-4 py-1.5 rounded-full transition-colors">Seller Dashboard</button>}
        {user ? <>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action label="Home" labelIcon={<HomeIcon/>} onClick={() => router.push('/')} />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action label="Products" labelIcon={<BoxIcon />} onClick={() => router.push('/all-products')} />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
            </UserButton.MenuItems>
          </UserButton>
        </>
        :
        <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition">
          <Image src={assets.user_icon} alt="user icon" />
          Account
        </button>}
      </div>
    </nav>
  );
};

export default Navbar;