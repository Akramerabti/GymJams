import React from 'react';
import DiscountSignUpContainer from '../components/discount/DiscountSignUpContainer';
import { useNavigate } from 'react-router-dom';

const DiscountSignup = () => {
  const navigate = useNavigate();

  const handleSignupSuccess = (data) => {
    console.log('Signup successful:', data);
    if (data.type === 'discount_signup') {
      localStorage.setItem('discountCode', data.discountCode);
    }
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-orange-600 flex items-center justify-center p-4">
      <DiscountSignUpContainer onSuccess={handleSignupSuccess} />
    </div>
  );
};

export default DiscountSignup;
