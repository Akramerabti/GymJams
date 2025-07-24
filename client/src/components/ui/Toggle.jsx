import React, { useState } from 'react';

const Toggle = ({ checked, onChange, className }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      } ${className}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default Toggle;