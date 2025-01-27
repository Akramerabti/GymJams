import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Award, 
  Gamepad2,
  Dumbbell,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useAuthStore from '../stores/authStore';

const FeatureSection = ({ icon: Icon, title, description, link, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <Card className="h-full overflow-hidden bg-white/5 backdrop-blur-sm border-0 transition-all duration-300 hover:bg-white/10">
        <CardContent className="p-6">
          <div className="mb-4 inline-block p-3 rounded-lg bg-blue-500/10 text-blue-400">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {description}
          </p>
          <Button 
            variant="ghost" 
            className="text-blue-400 hover:text-blue-300 p-0 group-hover:translate-x-2 transition-transform"
          >
            Learn more <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: ShoppingBag,
      title: "Premium Equipment Shop",
      description: "Discover professional-grade fitness equipment curated for both home and commercial gyms. Quality meets affordability.",
      link: "/shop"
    },
    {
      icon: Award,
      title: "Expert Coaching",
      description: "Transform your fitness journey with personalized guidance from certified trainers. Results-driven programs tailored to your goals.",
      link: "/coaching"
    },
    {
      icon: Gamepad2,
      title: "Gamified Rewards",
      description: "Turn your workouts into rewards. Play exclusive games, earn points, and unlock special offers while staying fit.",
      link: "/games"
    },
    {
      icon: Dumbbell,
      title: "Track Your Gains",
      description: "Monitor your progress, set new records, and celebrate achievements. Your fitness journey, quantified.",
      link: "/gymbros"
    },
    {
      icon: MessageSquare,
      title: "Community Support",
      description: "Join a vibrant community of fitness enthusiasts. Share tips, get motivated, and grow stronger together.",
      link: "/contact"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <motion.section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJzLTQgMi00IDItMiAyLTIgNCAyIDQgMiA0IDIgMiA0IDIgNC0yIDQtMiAyLTIgMi00eiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat opacity-50"></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Elevate Your <span className="text-blue-400">Fitness</span> Journey
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience a new way to achieve your fitness goals with premium equipment, 
              expert coaching, and an engaging community.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/shop')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-full text-lg transition-all transform hover:scale-105"
            >
              Start Your Journey
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/30 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover our comprehensive suite of services designed to support your fitness journey
              from start to finish.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureSection key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-gray-300 mb-8">
            Join thousands of satisfied members who have already taken the first step
            towards their fitness goals.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? '/shop' : '/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-full text-lg transition-all transform hover:scale-105"
          >
            {user ? 'Explore Equipment' : 'Join Now'}
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;