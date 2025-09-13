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
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white bg-white/95 dark:bg-black/95 backdrop-blur-sm transition-all duration-300 flex md:grid md:grid-cols-[auto_1fr_auto] items-center justify-between md:gap-4">
      {/* Logo */}
      <Image
        className="cursor-pointer w-20 md:w-24"
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="logo"
        width={96}
        height={40}
      />
      
      {/* Desktop Menu Items - Truly Centered */}
      <div className="hidden md:block justify-self-center">
        <div className="bg-gray-300 dark:bg-gray-800/30 rounded-full px-2 py-1">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm"
            >
              Home
            </Link>
            <Link
              href="/all-products"
              className="px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm"
            >
              Contact
            </Link>
            <Link
              href="/customization"
              className="px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-sm"
            >
              Customization
            </Link>
          </div>
        </div>

        {/* Right Side: Trigger, ProfileMenu, Search Icon */}
        <div className="flex items-center gap-4">
          {/* Trigger (Theme Toggle) */}
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className="md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 dark:bg-black/95 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 transform transition-all duration-300">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Menu
              </h3>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Menu Content */}
            <div className="p-6 space-y-2">
              {/* Navigation Links */}
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon />
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Home
                </span>
              </Link>

              <Link
                href="/all-products"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BoxIcon />
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Shop
                </span>
              </Link>

              <Link
                href="/about"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  About
                </span>
              </Link>

              <Link
                href="/contact"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
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
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Contact
                </span>
              </Link>

              <Link
                href="/customization"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Customization
                </span>
              </Link>

              {/* Search in Mobile Menu */}
              <div className="px-4 py-3">
                <SearchDropdown
                  onMobileSelect={() => setMobileMenuOpen(false)}
                />
              </div>

              {/* Seller Dashboard in Mobile Menu */}
              {isSeller && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/seller");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 group"
                >
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Seller Dashboard
                  </span>
                </button>
              )}

              {/* User Actions if not logged in */}
              {!user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignIn();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  <Image
                    src={assets.user_icon}
                    alt="user icon"
                    className="w-5 h-5 filter brightness-0 invert"
                  />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        </>
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
