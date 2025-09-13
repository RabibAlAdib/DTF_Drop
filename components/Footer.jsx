import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 dark:border-gray-700 text-gray-500 dark:text-gray-300">
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
          <p className="mt-6 text-sm">
            DTF Drop is your premier destination for premium drop shoulder clothing. 
            We combine style with functionality, offering high-quality, comfortable 
            clothing designed for the modern lifestyle. Experience the perfect blend 
            of contemporary fashion and unmatched comfort.
          </p>
        </div>

        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white mb-5">Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <Link className="hover:underline hover:text-gray-800 dark:hover:text-gray-100 transition" href="/">Home</Link>
              </li>
              <li>
                <Link className="hover:underline hover:text-gray-800 dark:hover:text-gray-100 transition" href="/about">About us</Link>
              </li>
              <li>
                <Link className="hover:underline hover:text-gray-800 dark:hover:text-gray-100 transition" href="/contact">Contact us</Link>
              </li>
              <li>
                <Link className="hover:underline hover:text-gray-800 dark:hover:text-gray-100 transition" href="/customization">Customization</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white mb-5">Get in touch</h2>
            <div className="text-sm space-y-2">
              <a 
                href="https://wa.me/+8801344823831" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                +8801344823831
              </a>
              <p>dtfdrop25@gmail.com</p>
            </div>
            
            {/* Social Media Icons */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Follow Us</h3>
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com/dtfdrop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Facebook"
                >
                  <Image src={assets.facebook_icon} alt="Facebook" className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.facebook.com/groups/dtfdrop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Facebook Group"
                >
                  <Image src={assets.facebook_icon} alt="Facebook Group" className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.instagram.com/dtfdrop/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Instagram"
                >
                  <Image src={assets.instagram_icon} alt="Instagram" className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.tiktok.com/@dtf.drop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="TikTok"
                >
                  <div className="w-6 h-6 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                    <span className="text-white dark:text-black text-xs font-bold">T</span>
                  </div>
                </a>
                <a 
                  href="https://wa.me/+8801344823831" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="WhatsApp"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="py-4 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-black transition-colors duration-300">
        Copyright 2025 © DTF Drop. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;