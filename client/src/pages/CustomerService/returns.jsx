// client/src/pages/CustomerService/returns.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Package, TruckIcon, ArrowLeftRight, DollarSign, Clock, MapPin, HelpCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Returns = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Returns & Refunds</h1>
          <p className="text-gray-600">
            Everything you need to know about our return policy and process
          </p>
        </div>
        
        <Alert className="mb-8">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            For questions about returns, please <Link to="/contact" className="text-blue-600 underline">contact our support team</Link> or call us at (555) 123-4567.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">30-Day Returns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Return eligible items within 30 days of delivery for a full refund.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Free Return Shipping</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                For defective or incorrect items, return shipping is on us.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Fast Refunds</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Refunds are processed within 3-5 business days after we receive your return.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Return Policy</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="policy-1">
              <AccordionTrigger>Eligible Items</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Most unused items in their original packaging can be returned within 30 days of delivery. Exceptions include:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Opened supplements and nutrition products</li>
                  <li>Personalized or custom-made equipment</li>
                  <li>Hygiene products where the seal has been broken</li>
                  <li>Digital products and services</li>
                  <li>Gift cards and merchandise credits</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="policy-2">
              <AccordionTrigger>Return Conditions</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">To be eligible for a return, your item must be:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>In the same condition that you received it</li>
                  <li>In the original packaging</li>
                  <li>Complete with all parts and accessories</li>
                  <li>Accompanied by the receipt or proof of purchase</li>
                </ul>
                <p className="mt-2">
                  Items that are damaged, incomplete, or show signs of use beyond inspection may not qualify for a full refund.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="policy-3">
              <AccordionTrigger>Refund Process</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Once we receive your return, we'll inspect it and notify you of the status of your refund. If approved:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your refund will be processed to the original method of payment</li>
                  <li>Credit card refunds typically take 5-10 business days to appear on your statement</li>
                  <li>Store credit refunds are processed immediately</li>
                </ul>
                <p className="mt-2">
                  Shipping costs are non-refundable except in cases of defective or incorrectly shipped items.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="policy-4">
              <AccordionTrigger>Exchanges</AccordionTrigger>
              <AccordionContent>
                <p>
                  If you need to exchange an item for the same item in a different size or color, please return the original item for a refund and place a new order for the replacement item. This ensures the quickest processing time.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="policy-5">
              <AccordionTrigger>Digital Products & Subscriptions</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Our digital products and subscription policies:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Digital downloads are non-refundable once accessed or downloaded</li>
                  <li>Coaching subscriptions can be cancelled within 10 days of purchase for a full refund if no sessions have been conducted</li>
                  <li>Monthly membership plans can be cancelled at any time, with service continuing until the end of the current billing period</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">How to Return an Item</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Online Purchases
              </h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <span className="font-medium">Initiate Return:</span> Log in to your account, go to "Order History," select the order and item to return, and follow the on-screen instructions.
                </li>
                <li>
                  <span className="font-medium">Print Label:</span> Download and print the prepaid return shipping label (if eligible for free returns).
                </li>
                <li>
                  <span className="font-medium">Package Item:</span> Securely package the item in its original packaging with all components.
                </li>
                <li>
                  <span className="font-medium">Ship Return:</span> Drop off the package at any authorized shipping location.
                </li>
                <li>
                  <span className="font-medium">Track Status:</span> Monitor your return and refund status in your account.
                </li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                In-Store Purchases
              </h3>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <span className="font-medium">Visit Store:</span> Return to any of our retail locations within 30 days of purchase.
                </li>
                <li>
                  <span className="font-medium">Bring Receipt:</span> Present your original receipt or order confirmation email.
                </li>
                <li>
                  <span className="font-medium">Original Packaging:</span> Return the item in its original packaging with all components.
                </li>
                <li>
                  <span className="font-medium">Refund Method:</span> Refunds will be issued to the original payment method used at purchase.
                </li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-4">Need Help with Your Return?</h2>
          <p className="text-gray-600 mb-6">
            Our customer service team is ready to assist you with any questions or concerns about returns and refunds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
            <Link to="/faq">
              <Button className="w-full sm:w-auto">
                View FAQ
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <h3 className="font-semibold text-lg mb-2">Taskforce Support</h3>
          <p className="text-gray-600 mb-4">
            Our Taskforce team is dedicated to resolving return issues quickly and efficiently.
            Interested in joining our Taskforce? We're always looking for customer-focused individuals.
          </p>
          <Link to="/application">
            <Button variant="outline">
              Apply to Join Our Team
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Returns;