"use client";

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex justify-center items-center w-full mb-8">
      <div className="flex flex-wrap justify-center items-center gap-1 md:gap-4 bg-orange-900 dark:bg-orange-800 rounded-full px-6 py-3 shadow-lg border border-orange-700 dark:border-orange-600">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            title={category} // Show full text on hover
            className={`px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium whitespace-nowrap
              ${activeCategory === category
                ? 'bg-orange-600 text-white shadow-md transform scale-105' 
                : 'text-orange-100 hover:text-white hover:bg-orange-700 dark:hover:bg-orange-600'
              }`}
          >
            {truncateText(category.toUpperCase(), 15)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;