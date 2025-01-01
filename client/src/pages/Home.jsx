import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '../hooks/useProducts';
import useAuthStore from '../stores/authStore';

const ProductCard = ({ product }) => (
  <Card>
    <CardContent className="p-4">
      <div className="aspect-square overflow-hidden rounded-lg mb-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-semibold mb-2">{product.name}</h3>
      <p className="text-gray-600">${product.price.toFixed(2)}</p>
    </CardContent>
  </Card>
);

const Home = () => {
  const navigate = useNavigate();
  const { featuredProducts } = useProducts();
  const { user, isAuthenticated, checkAuth, loading } = useAuthStore();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const features = [
    {
      icon: <Dumbbell className="w-12 h-12 text-blue-600" />,
      title: 'Premium Equipment',
      description: 'High-quality gym equipment for professionals and enthusiasts'
    },
    {
      icon: <Truck className="w-12 h-12 text-blue-600" />,
      title: 'Fast Shipping',
      description: 'Free delivery on orders over $100'
    },
    {
      icon: <Shield className="w-12 h-12 text-blue-600" />,
      title: 'Warranty',
      description: 'Extended warranty on all equipment'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Transform Your Fitness Journey
            </h1>
            <p className="text-lg lg:text-xl mb-8">
              Premium gym equipment for your home or commercial gym.
              Professional grade quality at competitive prices.
            </p>
            {isAuthenticated && user ? (
              <p className="text-lg lg:text-xl mb-8">
                Welcome back, {user.firstName}! 🎉
              </p>
            ) : (
              <Button 
                size="lg" 
                onClick={() => navigate('/shop')}
                className="group"
              >
                Shop Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center text-center p-6"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;