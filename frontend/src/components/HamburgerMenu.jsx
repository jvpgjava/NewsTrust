import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BarChart3, Search, Network, Info } from 'lucide-react';

const HamburgerMenu = ({ currentPage, onPageChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'news-analysis', label: 'Análise de Notícias', icon: Search },
    { id: 'network', label: 'Rede de Confiança', icon: Network },
    { id: 'about', label: 'Sobre o Sistema', icon: Info }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (pageId) => {
    onPageChange(pageId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão Hambúrguer */}
      <button
        onClick={toggleMenu}
        className="fixed top-3 right-3 z-50 p-2.5 sm:p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 touch-manipulation"
        aria-label="Menu"
      >
        <motion.div
          animate={isOpen ? "open" : "closed"}
          className="w-7 h-7 flex flex-col justify-center items-center"
        >
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 7 }
            }}
            className="w-6 h-0.5 bg-gray-800 mb-1.5 origin-center rounded-full"
          />
          <motion.span
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 }
            }}
            className="w-6 h-0.5 bg-gray-800 mb-1.5 rounded-full"
          />
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -7 }
            }}
            className="w-6 h-0.5 bg-gray-800 origin-center rounded-full"
          />
        </motion.div>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-2xl z-50 border-l border-gray-200"
          >
            {/* Header do Menu */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center">
                <img 
                  src="/iconeNewsTrust.png" 
                  alt="NewsTrust" 
                  className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                />
                <span className="ml-3 text-lg sm:text-xl font-bold text-gray-900 mt-1">NewsTrust</span>
              </div>
            </div>

            {/* Itens do Menu */}
            <nav className="p-3 sm:p-4">
              <ul className="space-y-1 sm:space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-left transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HamburgerMenu;
