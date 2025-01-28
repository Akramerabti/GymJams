import React, { useState } from 'react';

const TextArea = ({ value, onChange, placeholder = 'Type your message...', className = '' }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${className}`}
      rows={4}
    />
  );
};

export default TextArea;