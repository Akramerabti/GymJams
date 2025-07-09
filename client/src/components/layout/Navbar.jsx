import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme hook
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'; // Shadcn UI Sheet for mobile menu
import { Button } from '../ui/button'; // Shadcn UI Button
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'; // Shadcn UI Avatar
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'; // Shadcn UI Dropdown
import { ShoppingCart, Menu, X, Sun, Moon, Home, Dumbbell, Store, Gamepad, User, LogOut, Package, Settings, Users, FileText, BarChart, Bell, LifeBuoy, Shield, LayoutDashboard } from 'lucide-react'; // Icons from lucide-react

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cartItems } = useCartStore();
  const { theme, toggleTheme } = useTheme(); // Use theme and toggleTheme from context
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu


  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isGymBrosSetup = location.pathname.startsWith('/gymbros-setup');
  const isQuestionnaire = location.pathname.startsWith('/questionnaire');

  useEffect(() => {

    if (isGymBrosSetup || isQuestionnaire) {
      document.body.classList.add('hide-footer');
    } else {
      document.body.classList.remove('hide-footer');
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, isGymBrosSetup, isQuestionnaire]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between p-4 shadow-md transition-all duration-300 ease-in-out
      ${isScrolled ? 'bg-opacity-95 backdrop-blur-md' : 'bg-opacity-100'}
      bg-[var(--bg-navbar)] text-[var(--text-navbar)]`}
    >
      {/* Logo and Home Link */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="GymTonic Logo" className="h-8 w-8 rounded-full" />
          <span className="font-gym text-xl font-bold">GymTonic</span>
        </Link>
      </div>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center space-x-6">
        <Link to="/coaching" className="hover:text-primary-foreground transition-colors duration-200">
          <Dumbbell className="inline-block mr-1" size={18} /> Coaching
        </Link>
        <Link to="/shop" className="hover:text-primary-foreground transition-colors duration-200">
          <Store className="inline-block mr-1" size={18} /> Shop
        </Link>
        <Link to="/games" className="hover:text-primary-foreground transition-colors duration-200">
          <Gamepad className="inline-block mr-1" size={18} /> Games
        </Link>
        <Link to="/gymbros" className="hover:text-primary-foreground transition-colors duration-200">
          <Users className="inline-block mr-1" size={18} /> GymBros
        </Link>
        <Link to="/blog" className="hover:text-primary-foreground transition-colors duration-200">
          <FileText className="inline-block mr-1" size={18} /> Blog
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="rounded-full hover:bg-secondary-foreground hover:text-primary-foreground transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Link to="/cart" className="relative p-2 rounded-full hover:bg-secondary-foreground hover:text-primary-foreground transition-colors duration-200">
          <ShoppingCart size={20} />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {totalCartItems}
            </span>
          )}
        </Link>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture || `https://placehold.co/150x150/FFF/000?text=${user?.username?.charAt(0).toUpperCase() || '?'}`} alt={user?.username || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" onClick={closeMobileMenu} className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/orders" onClick={closeMobileMenu} className="flex items-center cursor-pointer">
                  <Package className="mr-2 h-4 w-4" /> Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/subscription-management" onClick={closeMobileMenu} className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Subscription
                </Link>
              </DropdownMenuItem>
              {user?.role === 'taskforce' && (
                <DropdownMenuItem asChild>
                  <Link to="/taskforce-dashboard" onClick={closeMobileMenu} className="flex items-center cursor-pointer">
                    <BarChart className="mr-2 h-4 w-4" /> Taskforce
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="flex items-center cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 transition-colors duration-200">Login</Button>
          </Link>
        )}

        {/* Mobile Menu Toggle (Hamburger) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open mobile menu">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-xs flex flex-col bg-background text-foreground">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <span className="font-gym text-xl font-bold">GymTonic</span>
              <Button variant="ghost" size="icon" onClick={closeMobileMenu} aria-label="Close mobile menu">
                <X size={24} />
              </Button>
            </div>
            <nav className="flex flex-col p-4 space-y-4 flex-grow">
              <Link to="/" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <Home className="mr-3 h-5 w-5" /> Home
              </Link>
              <Link to="/coaching" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <Dumbbell className="mr-3 h-5 w-5" /> Coaching
              </Link>
              <Link to="/shop" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <Store className="mr-3 h-5 w-5" /> Shop
              </Link>
              <Link to="/games" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <Gamepad className="mr-3 h-5 w-5" /> Games
              </Link>
              <Link to="/gymbros" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <Users className="inline-block mr-3 h-5 w-5" /> GymBros
              </Link>
              <Link to="/blog" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                <FileText className="inline-block mr-3 h-5 w-5" /> Blog
              </Link>
              <div className="border-t border-border my-4 pt-4"></div> 
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                    <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                    <User className="mr-3 h-5 w-5" /> Profile
                  </Link>
                  <Link to="/orders" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                    <Package className="mr-3 h-5 w-5" /> Orders
                  </Link>
                  <Link to="/subscription-management" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                    <Settings className="mr-3 h-5 w-5" /> Subscription
                  </Link>
                  {user?.role === 'taskforce' && (
                    <Link to="/taskforce-dashboard" onClick={closeMobileMenu} className="flex items-center text-lg hover:text-primary transition-colors duration-200">
                      <BarChart className="mr-3 h-5 w-5" /> Taskforce
                    </Link>
                  )}
                  <Button 
                    onClick={() => { logout(); closeMobileMenu(); }} 
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Log out
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-border mt-auto">
              <p className="text-sm font-semibold mb-2">Customer Service</p>
              <div className="flex flex-col space-y-2">
                <Link to="/contact" onClick={closeMobileMenu} className="flex items-center text-sm hover:text-primary transition-colors duration-200">
                  <LifeBuoy className="mr-2 h-4 w-4" /> Contact Us
                </Link>
                <Link to="/faq" onClick={closeMobileMenu} className="flex items-center text-sm hover:text-primary transition-colors duration-200">
                  <Shield className="mr-2 h-4 w-4" /> FAQ
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
