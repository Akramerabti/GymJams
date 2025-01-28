import React from 'react';

const FileInput = ({ onChange, className = '', multiple = false }) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        onChange={onChange}
        multiple={multiple}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
      />
      <div className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
        <span className="text-sm text-gray-700">Choose files</span>
      </div>
    </div>
  );
};

export default FileInput;