import React from 'react';

const ProductList = ({ products = [], onDeleteProduct }) => { // Default to an empty array if products is undefined
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product._id} className="p-4 border rounded-md">
          <h3 className="text-xl font-semibold">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-gray-800">${product.price}</p>
          <button
            onClick={() => onDeleteProduct(product._id)}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;