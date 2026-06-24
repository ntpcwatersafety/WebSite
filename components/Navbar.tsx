import React, { useState, useEffect } from 'react';
import { Menu, X, Waves, User, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../services/cms';
import { getMemberSession } from '../services/memberService';
import { MemberSession } from '../types';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const location = useLocation();

  useEffect(() => {
    setMemberSession(getMemberSession());
  }, [location]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-[78px] w-full items-center justify-center bg-white/95 px-4 shadow-md backdrop-blur-sm md:h-[70px] md:justify-between md:px-[5%]">
      <button 
        type="button"
        aria-label={isMenuOpen ? '關閉選單' : '開啟選單'}
        className="absolute left-4 p-1 text-primary md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <Link to="/" className="z-[52] mx-auto flex min-w-0 max-w-[calc(100%-88px)] items-center justify-center gap-2 text-primary md:mx-0 md:max-w-none md:justify-start">
        {!logoError ? (
          <img 
            src="https://lh3.googleusercontent.com/d/17JcUzZwnqsetUO7m-RVOelb1IFKqtN3F"
            alt="新北市水上安全協會 Logo" 
            className="h-9 w-9 flex-shrink-0 object-contain md:h-10 md:w-10"
            onError={() => setLogoError(true)}
          />
        ) : (
          <Waves className="h-7 w-7 flex-shrink-0 md:h-8 md:w-8" />
        )}
        <div className="min-w-0 text-left">
          <span className="block text-[15px] font-bold leading-tight tracking-[0.01em] sm:text-base md:text-2xl md:leading-none md:tracking-normal">新北市水上安全協會</span>
        </div>
      </Link>

      <div className="absolute right-4 h-9 w-9 md:hidden" aria-hidden="true" />

      <ul className="hidden md:flex gap-6 list-none items-center">
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
        <li>
          {memberSession ? (
            <Link
              to="/member/profile"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <User size={14} />
              {memberSession.name}
            </Link>
          ) : (
            <Link
              to="/member/login"
              className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
            >
              <LogIn size={14} />
              會員登入
            </Link>
          )}
        </li>
      </ul>

      <div 
        className={`fixed left-0 top-[78px] flex h-[calc(100vh-78px)] w-full flex-col items-center gap-0 bg-white pt-6 shadow-xl transition-transform duration-300 ease-in-out md:top-[70px] md:h-[calc(100vh-70px)] md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full border-b border-gray-100 py-4 text-center text-lg font-medium hover:bg-gray-50 ${
                location.pathname === item.path ? 'text-secondary bg-blue-50/30' : 'text-gray-600'
            }`}
          >
            {item.label}
          </Link>
        ))}
        {memberSession ? (
          <Link
            to="/member/profile"
            className="flex w-full items-center justify-center gap-2 border-b border-gray-100 py-4 text-lg font-medium text-primary hover:bg-blue-50/30"
          >
            <User size={18} />
            {memberSession.name}
          </Link>
        ) : (
          <Link
            to="/member/login"
            className="flex w-full items-center justify-center gap-2 border-b border-gray-100 py-4 text-lg font-medium text-primary hover:bg-blue-50/30"
          >
            <LogIn size={18} />
            會員登入
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;