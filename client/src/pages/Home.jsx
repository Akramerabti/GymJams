import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '../hooks/useProducts';
import useAuthStore from '../stores/authStore';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Product Card Component with Animation
const ProductCard = ({ product }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
      transition={{ duration: 0.5 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="aspect-square overflow-hidden rounded-lg mb-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <h3 className="font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-600">${product.price.toFixed(2)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

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
      description: 'High-quality gym equipment for professionals and enthusiasts',
    },
    {
      icon: <Truck className="w-12 h-12 text-blue-600" />,
      title: 'Fast Shipping',
      description: 'Free delivery on orders over $100',
    },
    {
      icon: <Shield className="w-12 h-12 text-blue-600" />,
      title: 'Warranty',
      description: 'Extended warranty on all equipment',
    },
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
      {/* Hero Section with Parallax Effect */}
      <motion.section
        className="relative bg-gray-900 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[url('/images/gym-hero.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="container mx-auto px-4 py-24 lg:py-32 relative z-10">
          <div className="max-w-2xl">
            <motion.h1
              className="text-4xl lg:text-6xl font-bold mb-6"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Fitness Journey
            </motion.h1>
            <motion.p
              className="text-lg lg:text-xl mb-8"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Premium gym equipment for your home or commercial gym.
              Professional grade quality at competitive prices.
            </motion.p>
            {isAuthenticated && user ? (
              <motion.p
                className="text-lg lg:text-xl mb-8"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
              </motion.p>
            ) : (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate('/shop')}
                  className="group bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                >
                  Shop Now
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Features Section with Animated Icons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-lg transition-colors duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section with Lazy Loading */}
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