// components/taskforce/PromotionForm.jsx
import React, { useState } from 'react';

const PromotionForm = ({ products, onApplyPromotion }) => {
  const [promotion, setPromotion] = useState({
    productId: '',
    percentage: 0,
    startDate: '',
    endDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPromotion({ ...promotion, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyPromotion(promotion.productId, promotion);
    setPromotion({
      productId: '',
      percentage: 0,
      startDate: '',
      endDate: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select
        name="productId"
        value={promotion.productId}
        onChange={handleChange}
        className="w-full p-2 border rounded-md"
        required
      >
        <option value="">Select Product</option>
        {products.map((product) => (
          <option key={product._id} value={product._id}>
            {product.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="percentage"
        value={promotion.percentage}
        onChange={handleChange}
        placeholder="Discount Percentage"
        className="w-full p-2 border rounded-md"
        required
      />
      <input
        type="date"
        name="startDate"
        value={promotion.startDate}
        onChange={handleChange}
        placeholder="Start Date"
        className="w-full p-2 border rounded-md"
        required
      />
      <input
        type="date"
        name="endDate"
        value={promotion.endDate}
        onChange={handleChange}
        placeholder="End Date"
        className="w-full p-2 border rounded-md"
        required
      />
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
      >
        Apply Promotion
      </button>
    </form>
  );
};

export default PromotionForm;