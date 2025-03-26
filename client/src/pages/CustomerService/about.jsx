// client/src/pages/CustomerService/about.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AboutUs = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">About GymJams</h1>
          <p className="text-gray-600">
            Empowering your fitness journey with premium equipment and expert coaching
          </p>
        </div>
        
        <div className="mb-12">
          <img 
            src="/images/about-hero.jpg" // Replace with your image
            alt="GymJams Team" 
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/1200x400?text=GymJams+Team';
            }}
          />
        </div>
        
        <div className="prose prose-lg max-w-none mb-12">
          <h2>Our Mission</h2>
          <p>
            At GymJams, we believe that everyone deserves access to high-quality fitness equipment and expert guidance. 
            Our mission is to make fitness accessible, enjoyable, and effective for people of all levels.
          </p>
          
          <h2>Our Story</h2>
          <p>
            Founded in 2022, GymJams started as a small online store selling premium fitness equipment. 
            As we grew, we recognized the need for personalized coaching to help our customers maximize their results.
            Today, we offer a comprehensive platform that combines top-tier products with expert coaching services.
          </p>
          
          <h2>Our Team</h2>
          <p>
            Our team consists of passionate fitness enthusiasts, certified coaches, and industry experts who are dedicated to helping you achieve your fitness goals. 
            From product specialists to personal trainers, every member of the GymJams family is committed to your success.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Quality Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We curate only the best fitness equipment, ensuring durability, functionality, and value for your investment.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Expert Coaching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our certified coaches provide personalized guidance to help you reach your fitness goals safely and effectively.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Community Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Join our community of fitness enthusiasts who motivate and inspire each other on their fitness journeys.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-blue-50 p-8 rounded-lg text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
          <p className="text-gray-600 mb-6">
            Passionate about fitness? We're always looking for talented individuals to join our growing team.
          </p>
          <Link to="/application">
            <Button size="lg">
              View Open Positions
            </Button>
          </Link>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            We're here to help! Check out our FAQ or get in touch with our support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/faq">
              <Button variant="outline">
                View FAQ
              </Button>
            </Link>
            <Link to="/contact">
              <Button>
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;