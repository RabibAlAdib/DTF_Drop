"use client";

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex justify-center items-center w-full mb-8">
      <div className="flex flex-wrap justify-center items-center gap-1 md:gap-4 bg-gray-900 dark:bg-gray-800 rounded-full px-6 py-3 shadow-lg border border-gray-700 dark:border-gray-600">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium whitespace-nowrap
              ${activeCategory === category
                ? 'bg-red-600 text-white shadow-md transform scale-105' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600'
              }`}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;