"use client";
import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import CategoryFilter from "@/components/CategoryFilter";
import DesignTypeDropdown from "@/components/DesignTypeDropdown";
import { useAppContext } from "@/context/AppContext";

const AllProducts = () => {
    const { products } = useAppContext();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeDesignType, setActiveDesignType] = useState('ALL');

    // Define specific categories as per requirements
    const categories = useMemo(() => {
        const requiredCategories = ['Drop Shoulder', 'Panjabi', 'Pant', 'Shirt', 'Polo T-shirt', 'Half Sleeve T-shirt', 'Full Sleeve T-shirt'];
        const existingCategories = new Set();
        products.forEach(product => {
            if (product.category && requiredCategories.includes(product.category)) {
                existingCategories.add(product.category);
            }
        });
        return ['ALL', ...requiredCategories.filter(cat => existingCategories.has(cat))];
    }, [products]);

    // Get design types from product model
    const designTypes = useMemo(() => {
        const uniqueDesignTypes = new Set();
        products.forEach(product => {
            if (product.designType) {
                uniqueDesignTypes.add(product.designType);
            }
        });
        return ['ALL', ...Array.from(uniqueDesignTypes).sort()];
    }, [products]);

    // Filter products based on selected category and design type
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const categoryMatch = activeCategory === 'ALL' || product.category === activeCategory;
            const designTypeMatch = activeDesignType === 'ALL' || product.designType === activeDesignType;
            return categoryMatch && designTypeMatch;
        });
    }, [products, activeCategory, activeDesignType]);

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
    };

    const handleDesignTypeChange = (designType) => {
        setActiveDesignType(designType);
    };

    return (
        <>
            <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black min-h-screen">
                {/* Header */}
                <div className="flex flex-col items-center pt-12 w-full px-6">
                    <p className="text-2xl font-medium text-gray-800 dark:text-white animate-pulse-glow text-center">
                        All products
                    </p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-full animate-gradient"></div>
                </div>
                
                {/* Category Filter - Top Center */}
                <div className="w-full mt-8 px-6">
                    <CategoryFilter 
                        categories={categories}
                        activeCategory={activeCategory}
                        onCategoryChange={handleCategoryChange}
                        title="Categories"
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 px-6 md:px-16 lg:px-32 mt-6">
                    {/* Left Sidebar - DesignType Dropdown */}
                    <div className="w-full lg:w-64 lg:flex-shrink-0">
                        <DesignTypeDropdown 
                            designTypes={designTypes}
                            activeDesignType={activeDesignType}
                            onDesignTypeChange={handleDesignTypeChange}
                        />
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1">
                        {/* Product Count */}
                        <div className="w-full text-center mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                                {activeCategory !== 'ALL' && ` in category "${activeCategory}"`}
                                {activeDesignType !== 'ALL' && ` with design type "${activeDesignType}"`}
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 pb-14">
                            {filteredProducts.map((product, index) => (
                                <div
                                    key={product._id || index}
                                    className="border-2 border-transparent rounded-lg hover:animate-border-glow transition-all duration-300 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        {/* No Products Message */}
                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center w-full py-16">
                                <div className="text-gray-500 dark:text-gray-400 text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.5a2.5 2.5 0 00-2.5 2.5v0a2.5 2.5 0 01-2.5 2.5H12" />
                                    </svg>
                                    <h3 className="text-lg font-medium mb-2">No products found</h3>
                                    <p className="text-sm">
                                        No products found matching your filters.
                                        {activeCategory !== 'ALL' && ` Category: ${activeCategory}`}
                                        {activeDesignType !== 'ALL' && ` Design Type: ${activeDesignType}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;
