import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_CONFIG = {
  all: { label: 'All', emoji: '🍽️' },
  meat: { label: 'Meat', emoji: '🥩' },
  vegetable: { label: 'Vegetarian', emoji: '🥗' },
  sauces: { label: 'Sauces', emoji: '🍯' },
  desserts: { label: 'Desserts', emoji: '🍰' },
  drinks: { label: 'Drinks', emoji: '🥤' }
};

const CategoryTabs = ({ selectedCategory, onCategoryChange, categoryCounts = {} }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [activeTabRef, setActiveTabRef] = useState(null);

  // Check scroll position and update arrow visibility
  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll to active tab when category changes
  useEffect(() => {
    if (activeTabRef && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeTab = activeTabRef;
      
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      
      const isTabVisible = tabRect.left >= containerRect.left && 
                          tabRect.right <= containerRect.right;
      
      if (!isTabVisible) {
        const scrollLeft = activeTab.offsetLeft - (container.clientWidth / 2) + (activeTab.clientWidth / 2);
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory, activeTabRef]);

  // Initial arrow visibility check
  useEffect(() => {
    updateArrowVisibility();
    
    const handleResize = () => updateArrowVisibility();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  };

  const handleTabClick = (category) => {
    onCategoryChange(category);
  };

  // Get available categories (only show categories with items)
  const availableCategories = Object.keys(CATEGORY_CONFIG).filter(category => 
    category === 'all' || (categoryCounts[category] && categoryCounts[category] > 0)
  );

  return (
    <div className="relative border-b border-border-color">
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-surface-color to-transparent flex items-center justify-center"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </motion.button>
      )}

      {/* Right scroll arrow */}
      {showRightArrow && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-surface-color to-transparent flex items-center justify-center"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </motion.button>
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hidden py-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
        onScroll={updateArrowVisibility}
      >
        <div className="flex space-x-2 px-4 min-w-max">
          {availableCategories.map((category) => {
            const config = CATEGORY_CONFIG[category];
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] || 0;

            return (
              <motion.button
                key={category}
                ref={isActive ? setActiveTabRef : null}
                onClick={() => handleTabClick(category)}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex items-center space-x-2 px-4 py-2 rounded-full
                  transition-all duration-200 whitespace-nowrap touch-target
                  ${isActive
                    ? 'bg-primary-color text-white shadow-md'
                    : 'bg-transparent text-text-secondary hover:bg-background-color hover:text-text-primary'
                  }
                `}
                aria-pressed={isActive}
                aria-label={`Filter by ${config.label} category`}
              >
                <span className="text-lg" role="img" aria-label={config.label}>
                  {config.emoji}
                </span>
                <span className="font-medium">
                  {config.label}
                </span>
                {category !== 'all' && count > 0 && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${isActive
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-text-light text-white'
                    }
                  `}>
                    {count}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-color rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Gradient overlays for scroll indication */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-color to-transparent pointer-events-none" />
      )}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-color to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default CategoryTabs;