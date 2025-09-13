'use client'
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

const AllProducts = () => {

    const { products } = useAppContext();

    return (
        <>
            <div className="flex flex-col items-start px-6 md:px-16 lg:px-32 bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black min-h-screen">
                <div className="flex flex-col items-end pt-12">
                    <p className="text-2xl font-medium text-gray-800 dark:text-white animate-pulse-glow">All products</p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-full animate-gradient"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
                    {products.map((product, index) => <div key={index} className="animate-float-delay-1 hover:scale-105 transition-transform duration-300"><ProductCard product={product} /></div>)}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;
