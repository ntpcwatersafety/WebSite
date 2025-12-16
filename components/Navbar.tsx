import React, { useState, useEffect } from 'react';
import { Menu, X, Waves } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../services/cms';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <nav className="fixed top-0 left-0 w-full h-[70px] bg-white/95 backdrop-blur-sm shadow-md z-50 flex items-center justify-between px-[5%] md:px-[5%]">
      {/* Mobile Menu Button - Absolute Left on Mobile */}
      <button 
        className="md:hidden absolute left-5 text-primary p-1"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Logo - Centered on Mobile, Left on Desktop */}
      <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2 mx-auto md:mx-0 z-[52]">
        <Waves className="w-8 h-8" />
        <span>新北市水上救生協會</span>
      </Link>

      {/* Desktop Menu */}
      <ul className="hidden md:flex gap-6 list-none">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={`text-gray-600 font-medium transition-colors hover:text-secondary ${
                location.pathname === item.path ? 'text-secondary' : ''
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed top-[70px] left-0 w-full h-[calc(100vh-70px)] bg-white shadow-xl flex flex-col items-center pt-8 gap-0 transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full text-center py-5 text-xl font-medium border-b border-gray-100 hover:bg-gray-50 ${
                location.pathname === item.path ? 'text-secondary bg-blue-50/30' : 'text-gray-600'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;