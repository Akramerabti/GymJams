import React from 'react';
import { cn } from "@/lib/utils";

const TextArea = React.forwardRef(({ 
  className, 
  value, 
  onChange, 
  placeholder = 'Type your message...', 
  rows = 4,
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      rows={rows}
      {...props}
    />
  );
});

TextArea.displayName = "TextArea";

// Export both as default and named export for compatibility
export { TextArea };
export default TextArea;