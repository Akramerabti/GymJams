import React, { createContext, useContext } from 'react';

const RadioGroupContext = createContext();

export const RadioGroup = ({ value, onValueChange, children }) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" className="space-y-2">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = ({ value, id, children }) => {
  const { value: selectedValue, onValueChange } = useContext(RadioGroupContext);

  const isSelected = value === selectedValue;

  return (
    <div
      className={`flex items-center space-x-2 p-3 rounded-md border ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <input
        type="radio"
        id={id}
        value={value}
        checked={isSelected}
        onChange={() => onValueChange(value)}
        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer">
        {children}
      </label>
    </div>
  );
};

