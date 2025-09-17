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
              <div className="flex space-x-4 mb-4">
                <a 
                  href="https://facebook.com/dtfdrop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Facebook"
                >
                  <svg className="w-6 h-6 fill-blue-600 dark:fill-blue-400" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/dtfdrop/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="Instagram"
                >
                  <svg className="w-6 h-6 fill-pink-500 dark:fill-pink-400" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.987 11.988 11.987s11.987-5.369 11.987-11.987C24.004 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z"/>
                    <path d="M17.96 8.233H6.04c-.22 0-.4.18-.4.4v7.004c0 .22.18.4.4.4h11.92c.22 0 .4-.18.4-.4V8.633c0-.22-.18-.4-.4-.4zM12 16.013c-2.208 0-4-1.792-4-4s1.792-4 4-4 4 1.792 4 4-1.792 4-4 4zm4.7-7.013c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@dtf.drop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="TikTok"
                >
                  <svg className="w-6 h-6 fill-black dark:fill-white" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a 
                  href="https://wa.me/+8801344823831" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title="WhatsApp"
                >
                  <svg className="w-6 h-6 fill-green-500" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </a>
              </div>
              
              {/* Facebook Group Text Link */}
              <div className="text-sm">
                <a 
                  href="https://www.facebook.com/groups/dtfdrop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Join our Facebook Group →
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