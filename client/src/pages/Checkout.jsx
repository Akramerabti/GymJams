// Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ArrowRight, Truck, MapPin, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    billing: {
      sameAsShipping: true,
      firstName: '',
      lastName: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Redirect to cart if no items
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const validateShippingForm = () => {
    const newErrors = {};
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone',
      'address', 'city', 'state', 'zipCode'
    ];

    requiredFields.forEach(field => {
      if (!formData.shipping[field]?.trim()) {
        newErrors[`shipping.${field}`] = 'This field is required';
      }
    });

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.shipping.email)) {
      newErrors['shipping.email'] = 'Please enter a valid email';
    }

    // Phone validation
    if (!/^\+?[\d\s-]{10,}$/.test(formData.shipping.phone)) {
      newErrors['shipping.phone'] = 'Please enter a valid phone number';
    }

    // ZIP code validation
    if (!/^\d{5}(-\d{4})?$/.test(formData.shipping.zipCode)) {
      newErrors['shipping.zipCode'] = 'Please enter a valid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear error when user types
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const handleBillingToggle = (e) => {
    const sameAsShipping = e.target.checked;
    setFormData(prev => ({
      ...prev,
      billing: {
        ...prev.billing,
        sameAsShipping,
        ...(sameAsShipping ? prev.shipping : {})
      }
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateShippingForm()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create order
      const orderData = {
        items,
        total,
        shipping: formData.shipping,
        billing: formData.billing.sameAsShipping ? formData.shipping : formData.billing
      };

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId } = await orderResponse.json();

      // Process payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: total,
          currency: 'usd'
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment failed');
      }

      // Success! Clear cart and redirect
      clearCart();
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({
        submit: 'An error occurred during checkout. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <span className="ml-2">Shipping</span>
          </div>
          <div className={`flex-1 border-t-2 ${currentStep >= 2 ? 'border-blue-600' : 'border-gray-200'}`} />
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="ml-2">Payment</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Form */}
        <div className="flex-1">
          {currentStep === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={formData.shipping.firstName}
                      onChange={(e) => handleInputChange('shipping', 'firstName', e.target.value)}
                      error={errors['shipping.firstName']}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={formData.shipping.lastName}
                      onChange={(e) => handleInputChange('shipping', 'lastName', e.target.value)}
                      error={errors['shipping.lastName']}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={formData.shipping.email}
                      onChange={(e) => handleInputChange('shipping', 'email', e.target.value)}
                      error={errors['shipping.email']}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={formData.shipping.phone}
                      onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                      error={errors['shipping.phone']}
                      required
                    />
                  </div>

                  <Input
                    label="Street Address"
                    value={formData.shipping.address}
                    onChange={(e) => handleInputChange('shipping', 'address', e.target.value)}
                    error={errors['shipping.address']}
                    required
                  />

                  <Input
                    label="Apartment, suite, etc. (optional)"
                    value={formData.shipping.apartment}
                    onChange={(e) => handleInputChange('shipping', 'apartment', e.target.value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={formData.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      error={errors['shipping.city']}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.shipping.state}
                      onChange={(e) => handleInputChange('shipping', 'state', e.target.value)}
                      error={errors['shipping.state']}
                      required
                    />
                    <Input
                      label="ZIP Code"
                      value={formData.shipping.zipCode}
                      onChange={(e) => handleInputChange('shipping', 'zipCode', e.target.value)}
                      error={errors['shipping.zipCode']}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleNextStep}
                  className="flex items-center"
                >
                  Continue to Payment
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Elements stripe={stripePromise}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Stripe Elements will go here */}
                  <div className="mb-6">
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={formData.billing.sameAsShipping}
                        onChange={handleBillingToggle}
                        className="mr-2"
                      />
                      <span>Billing address same as shipping</span>
                    </label>
                    {!formData.billing.sameAsShipping && (
                      <div className="space-y-4">
                        {/* Billing address fields */}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                  >
                    Back to Shipping
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                  </Button>
                </CardFooter>
              </Card>
            </Elements>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:w-96">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Calculated at next step</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;