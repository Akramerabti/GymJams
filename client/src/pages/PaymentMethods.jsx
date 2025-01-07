import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import paymentService from '../services/payment.service';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CreditCard, Plus, Edit, Trash, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PaymentMethods = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'credit_card',
    cardNumber: '',
    expirationDate: '',
    paypalEmail: '',
    bankAccount: {
      accountNumber: '',
      routingNumber: '',
    },
    isDefault: false,
  });
  const [expirationDateError, setExpirationDateError] = useState(''); // State for expiration date error

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods(user.user._id);
  
      // Sort payment methods so that the default method appears first
      const sortedMethods = methods.sort((a, b) => {
        if (a.isDefault) return -1; // Default method comes first
        if (b.isDefault) return 1;  // Default method comes first
        return 0; // Maintain order for non-default methods
      });
  
      setPaymentMethods(sortedMethods);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to fetch payment methods. Please try again.');
    }
  };

  // Function to validate the expiration date
  const validateExpirationDate = (expirationDate) => {
    const [month, year] = expirationDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last two digits of the year
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed

    if (year < currentYear || (year == currentYear && month < currentMonth)) {
      setExpirationDateError('Expiration date cannot be in the past.');
      return false;
    } else {
      setExpirationDateError('');
      return true;
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      // Format the credit card number by removing non-numeric characters
      const formattedData = {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\D/g, ''), // Remove non-numeric characters
      };
  
      // Validate credit card number length
      if (formattedData.type === 'credit_card' && formattedData.cardNumber.length !== 16) {
        toast.error('Invalid credit card number. Please enter 16 digits.');
        return;
      }
  
      // Validate expiration date format (MM/YY)
      if (formattedData.type === 'credit_card') {
        const expirationDate = formattedData.expirationDate.replace(/\D/g, '');
        if (expirationDate.length !== 4 || !/^\d{2}\/\d{2}$/.test(formattedData.expirationDate)) {
          toast.error('Invalid expiration date. Please use MM/YY format.');
          return;
        }
  
        // Validate expiration date is not in the past
        if (!validateExpirationDate(formattedData.expirationDate)) {
          return; // Stop if the expiration date is invalid
        }
      }
  
      // If the new payment method is set as default, remove the default flag from all other methods
      if (formattedData.isDefault) {
        const updatedMethods = paymentMethods.map((method) => ({
          ...method,
          isDefault: false, // Remove default flag from all methods
        }));
        setPaymentMethods(updatedMethods);
      }
  
      // Call the payment service
      await paymentService.addPaymentMethod(user.user._id, formattedData);
      toast.success('Payment method added successfully!');
      fetchPaymentMethods(); // Refresh the list
      setFormData({
        type: 'credit_card',
        cardNumber: '',
        expirationDate: '',
        paypalEmail: '',
        bankAccount: {
          accountNumber: '',
          routingNumber: '',
        },
        isDefault: false,
      });
    } catch (error) {
      console.error('Failed to add payment method:', error);
      toast.error('Failed to add payment method. Please try again.');
    }
  };

  const handleEditPaymentMethod = async (methodId) => {
    try {
      // Format the credit card number by removing non-numeric characters
      const formattedData = {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\D/g, ''), // Remove non-numeric characters
      };
  
      // Validate credit card number length
      if (formattedData.type === 'credit_card' && formattedData.cardNumber.length !== 16) {
        toast.error('Invalid credit card number. Please enter 16 digits.');
        return;
      }
  
      // Validate expiration date format (MM/YY)
      if (formattedData.type === 'credit_card') {
        const expirationDate = formattedData.expirationDate.replace(/\D/g, '');
        if (expirationDate.length !== 4 || !/^\d{2}\/\d{2}$/.test(formattedData.expirationDate)) {
          toast.error('Invalid expiration date. Please use MM/YY format.');
          return;
        }
  
        // Validate expiration date is not in the past
        if (!validateExpirationDate(formattedData.expirationDate)) {
          return; // Stop if the expiration date is invalid
        }
      }
  
      // If the edited payment method is set as default, remove the default flag from all other methods
      if (formattedData.isDefault) {
        const updatedMethods = paymentMethods.map((method) => ({
          ...method,
          isDefault: method._id === methodId ? true : false, // Set only the current method as default
        }));
        setPaymentMethods(updatedMethods);
      }
  
      await paymentService.updatePaymentMethod(user.user._id, methodId, formattedData);
      toast.success('Payment method updated successfully!');
      fetchPaymentMethods(); // Refresh the list
      setEditingMethodId(null); // Exit edit mode
      setFormData({
        type: 'credit_card',
        cardNumber: '',
        expirationDate: '',
        paypalEmail: '',
        bankAccount: {
          accountNumber: '',
          routingNumber: '',
        },
        isDefault: false,
      });
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast.error('Failed to update payment method. Please try again.');
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    try {
      await paymentService.deletePaymentMethod(user.user._id, methodId);
      toast.success('Payment method deleted successfully!');
      fetchPaymentMethods(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method. Please try again.');
    }
  };

  const handleEditClick = (method) => {
    setEditingMethodId(method._id);
    setFormData({
      type: method.type,
      cardNumber: method.cardNumber || '',
      expirationDate: method.expirationDate || '',
      paypalEmail: method.paypalEmail || '',
      bankAccount: method.bankAccount || {
        accountNumber: '',
        routingNumber: '',
      },
      isDefault: method.isDefault || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingMethodId(null);
    setFormData({
      type: 'credit_card',
      cardNumber: '',
      expirationDate: '',
      paypalEmail: '',
      bankAccount: {
        accountNumber: '',
        routingNumber: '',
      },
      isDefault: false,
    });
  };

  const handleCardNumberChange = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    const formattedCardNumber = input.match(/.{1,4}/g)?.join(' ') || ''; // Add space every 4 digits
    setFormData({ ...formData, cardNumber: formattedCardNumber });
  };

  const handleExpirationDateChange = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    let formattedExpirationDate = input;

    if (input.length > 2) {
      formattedExpirationDate = `${input.slice(0, 2)}/${input.slice(2, 4)}`; // Format as MM/YY
    }

    setFormData({ ...formData, expirationDate: formattedExpirationDate });

    // Validate expiration date on change
    if (formattedExpirationDate.length === 5) {
      validateExpirationDate(formattedExpirationDate);
    } else {
      setExpirationDateError('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')} // Navigate to /profile
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" /> {/* Small arrow icon */}
          </Button>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
        </div>


        {/* Add/Edit Payment Method Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingMethodId ? 'Edit Payment Method' : 'Add Payment Method'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full p-2 border rounded"
                style={{ color: 'black' }}
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>

              {formData.type === 'credit_card' && (
                <>
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-2 border rounded"
                    style={{ color: 'black' }}
                  />
                  <input
                    type="text"
                    placeholder="Expiration Date (MM/YY)"
                    value={formData.expirationDate}
                    onChange={handleExpirationDateChange}
                    className="w-full p-2 border rounded"
                    style={{ color: 'black' }}
                  />
                  {expirationDateError && (
                    <p className="text-sm text-red-500">{expirationDateError}</p>
                  )}
                </>
              )}

              {formData.type === 'paypal' && (
                <input
                  type="email"
                  placeholder="PayPal Email"
                  value={formData.paypalEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, paypalEmail: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  style={{ color: 'black' }}
                />
              )}

              {formData.type === 'bank_transfer' && (
                <>
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={formData.bankAccount.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankAccount: {
                          ...formData.bankAccount,
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border rounded"
                    style={{ color: 'black' }}
                  />
                  <input
                    type="text"
                    placeholder="Routing Number"
                    value={formData.bankAccount.routingNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankAccount: {
                          ...formData.bankAccount,
                          routingNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border rounded"
                    style={{ color: 'black' }}
                  />
                </>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  style={{ color: 'black' }}
                />
                <label>Set as default payment method</label>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={
                    editingMethodId
                      ? () => handleEditPaymentMethod(editingMethodId)
                      : handleAddPaymentMethod
                  }
                >
                  {editingMethodId ? 'Save Changes' : 'Add Payment Method'}
                </Button>
                {editingMethodId && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Payment Methods */}
        {paymentMethods.map((method) => (
  <Card key={method._id} className="mb-4">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{method.type}</span>
        {method.isDefault && (
          <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
            Default
          </span>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {method.type === 'credit_card' && (
        <p>**** **** **** {method.cardNumber.slice(-4)}</p>
      )}
      {method.type === 'paypal' && <p>{method.paypalEmail}</p>}
      {method.type === 'bank_transfer' && (
        <p>Bank Account: {method.bankAccount.accountNumber}</p>
      )}
      <div className="flex space-x-4 mt-4">
        <Button
          variant="outline"
          onClick={() => handleEditClick(method)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleDeletePaymentMethod(method._id)}
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </CardContent>
  </Card>
))}
      </div>
    </div>
  );
};

export default PaymentMethods;