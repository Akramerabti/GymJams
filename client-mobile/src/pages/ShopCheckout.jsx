import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { SelectItem, SelectTrigger, SelectValue, SelectContent, Select } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { useCart } from '../stores/cartStore';
import useCartStore from '../stores/cartStore';
import inventoryService from '../services/inventory.service';
import { Loader2, AlertTriangle, ShoppingCart, Truck, MapPin, CreditCard, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import thirdPartyLogisticsService from '../services/thirdPartyLogistics.service';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Updates for the PaymentForm component in ShopCheckout.jsx

const PaymentForm = ({ clientSecret, orderId, onPaymentSuccess, onPaymentError, pointsUsed, pointsDiscount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Include the order ID and points information in the return URL
          return_url: `${window.location.origin}/order-confirmation/${orderId}?pointsUsed=${pointsUsed || 0}&pointsDiscount=${pointsDiscount || 0}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Pass along points information when reporting payment success
        await onPaymentSuccess(paymentIntent.id, pointsUsed, pointsDiscount);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {/* Display points information if points are being used */}
      {pointsUsed > 0 && pointsDiscount > 0 && (
        <div className="p-3 bg-green-50 rounded-md border border-green-100 text-sm">
          <div className="flex items-center text-green-800">
            <Check className="h-4 w-4 mr-2" />
            <span>Using {pointsUsed} points for ${pointsDiscount.toFixed(2)} discount</span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </Button>
    </form>
  );
};

const ShopCheckout = () => {
  const { items, subtotal, tax, shipping, total, itemCount, pointsDiscount, pointsUsed } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { processPayment, initiateCheckout, clearCart, validateCartStock } = useCartStore();
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validatingStock, setValidatingStock] = useState(true);
  const [stockValid, setStockValid] = useState(true);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loadingShippingRates, setLoadingShippingRates] = useState(false);

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
      country: 'United States',
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
      country: 'United States',
    },
    shippingMethod: 'standard',
  });

  const [formErrors, setFormErrors] = useState({});

  // Replace the error handling section with this:
useEffect(() => {
  const fetchShippingRates = async () => {
    if (!formData.shipping.zipCode || !formData.shipping.country) {
      return;
    }
    
    try {
      setLoadingShippingRates(true);
      
      const itemsForRates = items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const response = await thirdPartyLogisticsService.getShippingRates(
        itemsForRates,
        formData.shipping
      );
      
      if (response.rates && response.rates.length > 0) {
        setShippingMethods(response.rates);
        
        if (!formData.shippingMethod) {
          handleShippingMethodChange(response.rates[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      
      // Silently fall back to default rates - never show error to user
      const defaultRates = [
        { 
          id: 'standard', 
          name: 'Standard Shipping', 
          price: subtotal >= 100 ? 0 : 12.99,
          estimatedDeliveryDays: { min: 3, max: 7 },
          carrier: 'USPS'
        },
        { 
          id: 'express', 
          name: 'Express Shipping', 
          price: 24.99,
          estimatedDeliveryDays: { min: 1, max: 3 },
          carrier: 'UPS'
        }
      ];
      setShippingMethods(defaultRates);
    } finally {
      setLoadingShippingRates(false);
    }
  };
  
  if (step === 2) {
    fetchShippingRates();
  }
}, [formData.shipping.zipCode, formData.shipping.country, step, subtotal]);
  

  useEffect(() => {
    const validateStock = async () => {
      try {
        setValidatingStock(true);
        const isValid = await validateCartStock();
        setStockValid(isValid);
  
        if (!isValid) {
          const store = useCartStore.getState();
          setStockWarnings(store.stockWarnings);
        }
      } catch (error) {
        console.error('Error validating stock:', error);
        setStockValid(false);
      } finally {
        setValidatingStock(false);
      }
    };
  
    // Redirect to cart only if payment was not completed
    if (items.length === 0 && !isPaymentComplete) {
      navigate('/cart');
      toast.error('Payment failed. Please try again.'); // Notify the user that payment failed
      return;
    }
  
    validateStock();
  }, [items, navigate, validateCartStock, isPaymentComplete]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear error when field is changed
    if (formErrors[`${section}.${field}`]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const handleBillingToggle = (value) => {
    const sameAsShipping = value === 'same';

    setFormData((prev) => ({
      ...prev,
      billing: {
        ...prev.billing,
        sameAsShipping,
        ...(sameAsShipping
          ? {
              firstName: prev.shipping.firstName,
              lastName: prev.shipping.lastName,
              address: prev.shipping.address,
              apartment: prev.shipping.apartment,
              city: prev.shipping.city,
              state: prev.shipping.state,
              zipCode: prev.shipping.zipCode,
              country: prev.shipping.country,
            }
          : prev.billing),
      },
    }));
  };

  const handleShippingMethodChange = (methodId) => {
    // Find the selected method to get its price
    const selectedMethod = shippingMethods.find(method => method.id === methodId);
    
    setFormData(prev => ({
      ...prev,
      shippingMethod: methodId,
      selectedShippingRate: selectedMethod
    }));
  };
  

  const validateForm = () => {
    const newErrors = {};
    const requiredShippingFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
    ];

    // Validate shipping fields
    requiredShippingFields.forEach((field) => {
      if (!formData.shipping[field]) {
        newErrors[`shipping.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    // Validate email format
    if (formData.shipping.email && !/\S+@\S+\.\S+/.test(formData.shipping.email)) {
      newErrors['shipping.email'] = 'Please enter a valid email address';
    }

    // Validate billing fields if not same as shipping
    if (!formData.billing.sameAsShipping) {
      const requiredBillingFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];

      requiredBillingFields.forEach((field) => {
        if (!formData.billing[field]) {
          newErrors[`billing.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
        }
      });
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isFormValid = validateForm();
    if (!isFormValid) {
      toast.error('Please fill out all required fields correctly.');
      return;
    }
    setStep(2); // Move to the next step
    } else if (step === 2) {
      try {
        setLoading(true);
  
        // Include points information
        const result = await initiateCheckout({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          shippingAddress: formData.shipping,
          billingAddress: formData.billing.sameAsShipping ? formData.shipping : formData.billing,
          shippingMethod: formData.shippingMethod,
          userId: user?.id, // Pass the user ID if authenticated
          pointsUsed: pointsUsed || 0,
          pointsDiscount: pointsDiscount || 0
        });
  
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
          setOrderId(result.order._id);
          localStorage.setItem('lastOrderId', result.order._id);
          setStep(3);
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to initialize checkout. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    //("Payment success handler called with paymentIntentId:", paymentIntentId);
  
    try {
      setLoading(true);
      //("Processing payment on server side...");
  
      // Include points information when processing payment
      const paymentResult = await processPayment(paymentIntentId);
      //("Payment processing result:", paymentResult);
  
      // Mark payment as complete
      setIsPaymentComplete(true);
  
      // Navigate to the order confirmation page
      navigate(`/order-confirmation/${orderId}`, {
        state: {
          paymentIntentId,
          pointsUsed,
          pointsDiscount,
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (errorMessage) => {
    toast.error(errorMessage || 'Payment failed. Please try again.');
  };

  // If cart is empty, redirect to cart page
  if (items.length === 0) {
    return null; // useEffect will handle navigation
  }

  // Show loading while validating stock
  if (validatingStock) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Validating item availability...</p>
        </div>
      </div>
    );
  }

  // Show warning if stock is invalid
  if (!stockValid) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle>Stock Availability Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Some items in your cart are no longer available in the requested quantity:</p>
            <div className="space-y-4">
              {stockWarnings.map((item) => (
                <div key={item.id} className="p-4 border rounded-md">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-red-600">
                    {item.available === 0
                      ? 'This item is out of stock.'
                      : `Only ${item.available} units available (you requested ${item.requested}).`}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex space-x-4">
              <Button onClick={() => navigate('/cart')} className="flex-1">
                Return to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMethod = formData.shippingMethod 
  ? shippingMethods.find(m => m.id === formData.shippingMethod) 
  : null;

  const shippingCost = selectedMethod ? selectedMethod.price : shipping;

  const finalTotal = parseFloat(Math.max(0, subtotal + shippingCost + tax - pointsDiscount).toFixed(2));

  return (
    <div className="container mt-35 mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Checkout Progress */}
        <div className="mb-8">
          <div className="relative pb-8">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="mt-2 text-sm font-medium">Shipping</span>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                </div>
                <span className="mt-2 text-sm font-medium">Delivery</span>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="mt-2 text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Checkout Form */}
          <div className="lg:w-2/3">
            <Card className="mb-8">
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="shipping.firstName">First Name</Label>
                          <Input
                            id="shipping.firstName"
                            value={formData.shipping.firstName}
                            onChange={(e) => handleInputChange('shipping', 'firstName', e.target.value)}
                            className={formErrors['shipping.firstName'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.firstName'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.firstName']}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipping.lastName">Last Name</Label>
                          <Input
                            id="shipping.lastName"
                            value={formData.shipping.lastName}
                            onChange={(e) => handleInputChange('shipping', 'lastName', e.target.value)}
                            className={formErrors['shipping.lastName'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.lastName'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.lastName']}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="shipping.email">Email</Label>
                          <Input
                            id="shipping.email"
                            type="email"
                            value={formData.shipping.email}
                            onChange={(e) => handleInputChange('shipping', 'email', e.target.value)}
                            className={formErrors['shipping.email'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.email'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.email']}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipping.phone">Phone</Label>
                          <Input
                            id="shipping.phone"
                            value={formData.shipping.phone}
                            onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                            className={formErrors['shipping.phone'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.phone'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.phone']}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipping.address">Address</Label>
                        <Input
                          id="shipping.address"
                          value={formData.shipping.address}
                          onChange={(e) => handleInputChange('shipping', 'address', e.target.value)}
                          className={formErrors['shipping.address'] ? 'border-red-500' : ''}
                        />
                        {formErrors['shipping.address'] && (
                          <p className="text-red-500 text-sm">{formErrors['shipping.address']}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipping.apartment">Apartment, suite, etc. (optional)</Label>
                        <Input
                          id="shipping.apartment"
                          value={formData.shipping.apartment}
                          onChange={(e) => handleInputChange('shipping', 'apartment', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="shipping.city">City</Label>
                          <Input
                            id="shipping.city"
                            value={formData.shipping.city}
                            onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                            className={formErrors['shipping.city'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.city'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.city']}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipping.state">State</Label>
                          <Input
                            id="shipping.state"
                            value={formData.shipping.state}
                            onChange={(e) => handleInputChange('shipping', 'state', e.target.value)}
                            className={formErrors['shipping.state'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.state'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.state']}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shipping.zipCode">ZIP Code</Label>
                          <Input
                            id="shipping.zipCode"
                            value={formData.shipping.zipCode}
                            onChange={(e) => handleInputChange('shipping', 'zipCode', e.target.value)}
                            className={formErrors['shipping.zipCode'] ? 'border-red-500' : ''}
                          />
                          {formErrors['shipping.zipCode'] && (
                            <p className="text-red-500 text-sm">{formErrors['shipping.zipCode']}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipping.country">Country</Label>
                        <Select
                          value={formData.shipping.country}
                          onValueChange={(value) => handleInputChange('shipping', 'country', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-blue-600" />
                      Delivery Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Shipping Address</h3>
                        <div className="p-4 bg-gray-50 rounded-md">
                          <p>{formData.shipping.firstName} {formData.shipping.lastName}</p>
                          <p>{formData.shipping.address}</p>
                          {formData.shipping.apartment && <p>{formData.shipping.apartment}</p>}
                          <p>{formData.shipping.city}, {formData.shipping.state} {formData.shipping.zipCode}</p>
                          <p>{formData.shipping.country}</p>
                          <Button
                            variant="link"
                            className="p-0 h-auto mt-2"
                            onClick={() => setStep(1)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                            <h3 className="font-semibold">Shipping Method</h3>

                            {loadingShippingRates ? (
                                <div className="text-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">Calculating shipping rates...</p>
                                </div>
                              ) : (
                                <RadioGroup
                                defaultValue={formData.shippingMethod}
                                value={formData.shippingMethod}
                                onValueChange={handleShippingMethodChange}
                                className="space-y-3"
                              >
                                {shippingMethods.map(method => (
                                  <div key={method.id} className="flex items-center justify-between space-x-2 p-4 rounded-md border">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={method.id} id={method.id} />
                                      <Label htmlFor={method.id} className="cursor-pointer">
                                        <div>
                                          <p className="font-medium">{method.name}</p>
                                          <div className="text-sm text-gray-500 flex flex-col space-y-1">
                                            <span>
                                              {method.carrier} ({method.estimatedDeliveryDays.min}-{method.estimatedDeliveryDays.max} business days)
                                            </span>
                                          </div>
                                        </div>
                                      </Label>
                                    </div>
                                    <div className="font-semibold">
                                      {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                                    </div>
                                  </div>
                                ))}
                              </RadioGroup>
                            )}
                          </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold">Billing Address</h3>
                        <RadioGroup
                          defaultValue="same"
                          value={formData.billing.sameAsShipping ? 'same' : 'different'}
                          onValueChange={handleBillingToggle}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2 p-4 rounded-md border">
                            <RadioGroupItem value="same" id="same" />
                            <Label htmlFor="same" className="cursor-pointer">
                              Same as shipping address
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-4 rounded-md border">
                            <RadioGroupItem value="different" id="different" />
                            <Label htmlFor="different" className="cursor-pointer">
                              Use a different billing address
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {!formData.billing.sameAsShipping && (
                        <div className="space-y-6 border-t pt-6">
                          <h3 className="font-semibold">Billing Information</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="billing.firstName">First Name</Label>
                              <Input
                                id="billing.firstName"
                                value={formData.billing.firstName}
                                onChange={(e) => handleInputChange('billing', 'firstName', e.target.value)}
                                className={formErrors['billing.firstName'] ? 'border-red-500' : ''}
                              />
                              {formErrors['billing.firstName'] && (
                                <p className="text-red-500 text-sm">{formErrors['billing.firstName']}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing.lastName">Last Name</Label>
                              <Input
                                id="billing.lastName"
                                value={formData.billing.lastName}
                                onChange={(e) => handleInputChange('billing', 'lastName', e.target.value)}
                                className={formErrors['billing.lastName'] ? 'border-red-500' : ''}
                              />
                              {formErrors['billing.lastName'] && (
                                <p className="text-red-500 text-sm">{formErrors['billing.lastName']}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing.address">Address</Label>
                            <Input
                              id="billing.address"
                              value={formData.billing.address}
                              onChange={(e) => handleInputChange('billing', 'address', e.target.value)}
                              className={formErrors['billing.address'] ? 'border-red-500' : ''}
                            />
                            {formErrors['billing.address'] && (
                              <p className="text-red-500 text-sm">{formErrors['billing.address']}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing.apartment">Apartment, suite, etc. (optional)</Label>
                            <Input
                              id="billing.apartment"
                              value={formData.billing.apartment}
                              onChange={(e) => handleInputChange('billing', 'apartment', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="billing.city">City</Label>
                              <Input
                                id="billing.city"
                                value={formData.billing.city}
                                onChange={(e) => handleInputChange('billing', 'city', e.target.value)}
                                className={formErrors['billing.city'] ? 'border-red-500' : ''}
                              />
                              {formErrors['billing.city'] && (
                                <p className="text-red-500 text-sm">{formErrors['billing.city']}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing.state">State</Label>
                              <Input
                                id="billing.state"
                                value={formData.billing.state}
                                onChange={(e) => handleInputChange('billing', 'state', e.target.value)}
                                className={formErrors['billing.state'] ? 'border-red-500' : ''}
                              />
                              {formErrors['billing.state'] && (
                                <p className="text-red-500 text-sm">{formErrors['billing.state']}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing.zipCode">ZIP Code</Label>
                              <Input
                                id="billing.zipCode"
                                value={formData.billing.zipCode}
                                onChange={(e) => handleInputChange('billing', 'zipCode', e.target.value)}
                                className={formErrors['billing.zipCode'] ? 'border-red-500' : ''}
                              />
                              {formErrors['billing.zipCode'] && (
                                <p className="text-red-500 text-sm">{formErrors['billing.zipCode']}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing.country">Country</Label>
                            <Select
                              value={formData.billing.country}
                              onValueChange={(value) => handleInputChange('billing', 'country', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                          clientSecret={clientSecret}
                          orderId={orderId}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                        />
                      </Elements>
                  </CardContent>
                </>
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {step < 3 && (
                <Button
                  onClick={handleNextStep}
                  disabled={loading || !stockValid}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  {step === 1 ? 'Continue to Delivery' : 'Continue to Payment'}
                </Button>
              )}
            </div>
          </div>
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  {/* Display points discount if applied */}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Points Discount</span>
                      <span>-${pointsDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${finalTotal}</span>
                    </div>

                    {/* Add a line to show points being used */}
                    {pointsUsed > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        Using {pointsUsed} points for a ${pointsDiscount.toFixed(2)} discount
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCheckout;