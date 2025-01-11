import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Coins, Dumbbell } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { useCart } from '../../hooks/useCart';
import { usePoints } from '../../hooks/usePoints'; // Import the usePoints hook

const Navbar = () => {
  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Coaching', path: '/coaching' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isTokenValid } = useAuth(); // Add isTokenValid from useAuth
  const { cartItems = [] } = useCart();
  const { balance, fetchPoints } = usePoints(); // Use the usePoints hook
  const userMenuRef = useRef(null);
  const location = useLocation();

  // Check token validity on mount and when user changes
  useEffect(() => {
    if (user && !isTokenValid()) {
      logout(); // Log the user out if the token is invalid
    }
  }, [user, isTokenValid, logout]);

  // Debounce the fetchPoints function
  useEffect(() => {
    let debounceTimeout;

    const debouncedFetchPoints = () => {
      if (user) {
        clearTimeout(debounceTimeout); // Clear any existing timeout
        debounceTimeout = setTimeout(() => {
          fetchPoints(); // Fetch points after a delay
        }, 500); // 500ms delay
      }
    };

    debouncedFetchPoints(); // Call the debounced function

    // Cleanup the timeout if the component unmounts or the user changes
    return () => clearTimeout(debounceTimeout);
  }, [user, fetchPoints]); // Re-run when the user changes

  // Close the user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">GymJams</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Section (Points, Cart, User Menu, Mobile Toggle) */}
          <div className="flex items-center space-x-4">
            {/* Points Balance (Logged-in Users Only) */}
            {user && isTokenValid() && ( // Only show points if the token is valid
              <div className="flex items-center space-x-2 border-r pr-4">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-gray-700">{balance} points</span>
              </div>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* User Menu (Logged-in Users) or Login Link */}
            {user && isTokenValid() ? ( // Only show user menu if the token is valid
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <User className="h-6 w-6" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg z-20 border border-gray-100">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors ${
                    location.pathname === item.path ? 'text-blue-600 font-semibold' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;