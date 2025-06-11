import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils"; // Ensure you have a class utility function
import React from "react"; // Import React for forwardRef

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }) => (
  <TabsPrimitive.List className={cn("flex border-b border-gray-200", className)} {...props} />
);

export const TabsTrigger = ({ className, ...props }) => (
  <TabsPrimitive.Trigger
    className={cn(
      "px-4 py-2 text-sm font-medium text-gray-600 hover:text-black",
      "data-[state=active]:border-b-2 data-[state=active]:border-black",
      className
    )}
    {...props}
  />
);

// Wrap TabsContent with React.forwardRef
export const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref} // Forward the ref to the underlying DOM element
    className={cn("p-4", className)}
    {...props}
  />
));

// Set a display name for the component (optional but recommended for debugging)
TabsContent.displayName = "TabsContent";