"use client";
import React, { useState } from "react";
import { BagIcon, BoxIcon, CartIcon, HomeIcon, assets } from "@/assets/assets";
import HeartIcon from "@/assets/HeartIcon";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";
import SearchDropdown from "./SearchDropdown";
import SearchModal from "./SearchModal";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { isSeller, router, user } = useAppContext();
  const { openSignIn } = useClerk();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 lg:px-32 py-1.5 border-b border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white bg-white/95 dark:bg-black/95 backdrop-blur-sm transition-all duration-300 flex md:grid md:grid-cols-[auto_1fr_auto] items-center justify-between md:gap-4">
      {/* Logo */}
      <Image
        className="cursor-pointer w-16 md:w-20"
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="logo"
        width={96}
        height={40}
      />

      {/* Desktop Menu Items - Truly Centered */}
      <div className="hidden md:block justify-self-center">
        <div className="bg-gray-200 dark:bg-gray-800/40 rounded-full px-2 py-1 shadow-sm">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-full hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:shadow-md transition-all duration-300 text-sm font-medium hover:scale-105"
            >
              Home
            </Link>
            <Link
              href="/all-products"
              className="px-4 py-2 rounded-full hover:bg-green-500 hover:text-white dark:hover:bg-green-600 dark:hover:text-white hover:shadow-md transition-all duration-300 text-sm font-medium hover:scale-105"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 rounded-full hover:bg-purple-500 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white hover:shadow-md transition-all duration-300 text-sm font-medium hover:scale-105"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-full hover:bg-orange-500 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white hover:shadow-md transition-all duration-300 text-sm font-medium hover:scale-105"
            >
              Contact
            </Link>
            <Link
              href="/customization"
              className="px-4 py-2 rounded-full hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:shadow-md transition-all duration-300 text-sm font-medium hover:scale-105"
            >
              Customization
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side: Theme Toggle, Profile Menu, Search Icon */}
      <div className="hidden md:flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Menu */}
        {user ? (
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors",
                userButtonPopoverCard:
                  "rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="Cart"
                labelIcon={<CartIcon />}
                onClick={() => router.push("/cart")}
              />
              <UserButton.Action
                label="My Orders"
                labelIcon={<BagIcon />}
                onClick={() => router.push("/my-orders")}
              />
              <UserButton.Action
                label="Favorites"
                labelIcon={<HeartIcon />}
                onClick={() => router.push("/favorites")}
              />
              {isSeller && (
                <UserButton.Action
                  label="Seller Dashboard"
                  labelIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  }
                  onClick={() => router.push("/seller")}
                />
              )}
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
          >
            <Image
              src={assets.user_icon}
              alt="user icon"
              className="w-4 h-4 filter brightness-0 invert"
            />
            Sign In
          </button>
        )}

        {/* Search Icon */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Search"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center md:hidden gap-3">
        {/* User Button for Mobile */}
        {user ? (
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="Cart"
                labelIcon={<CartIcon />}
                onClick={() => router.push("/cart")}
              />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Favorites"
                labelIcon={<HeartIcon />}
                onClick={() => router.push("/favorites")}
              />
            </UserButton.MenuItems>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Orders"
                labelIcon={<BagIcon />}
                onClick={() => router.push("/my-orders")}
              />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button
            onClick={openSignIn}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm"
          >
            <Image
              src={assets.user_icon}
              alt="user icon"
              className="w-4 h-4 filter brightness-0 invert"
            />
            Sign In
          </button>
        )}

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 relative z-50"
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <div
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? "transform rotate-45 translate-y-2" : ""}`}
            ></div>
            <div
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}
            ></div>
            <div
              className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? "transform -rotate-45 -translate-y-2" : ""}`}
            ></div>
          </div>
        </button>
      </div>

      {/* Simplified Mobile Menu - Optimized Structure */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Simple backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          
          {/* Simple menu container */}
          <div className="absolute top-0 right-0 w-80 max-w-[90vw] h-full bg-white dark:bg-gray-900 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h3>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Direct navigation items - no complex nesting */}
            <div className="p-4 space-y-3">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Home</span>
              </Link>
              
              <Link 
                href="/all-products" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
              >
                <BoxIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Shop</span>
              </Link>
              
              <Link 
                href="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">About</span>
              </Link>
              
              <Link 
                href="/contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">Contact</span>
              </Link>
              
              <Link 
                href="/customization" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-white">Customization</span>
              </Link>

              {/* Search */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Products</span>
                </div>
                <SearchDropdown onMobileSelect={() => setMobileMenuOpen(false)} />
              </div>

              {/* Seller Dashboard */}
              {isSeller && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/seller");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">Seller Dashboard</span>
                </button>
              )}

              {/* Sign In Button */}
              {!user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignIn();
                  }}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Image src={assets.user_icon} alt="user icon" className="w-5 h-5 filter brightness-0 invert" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
