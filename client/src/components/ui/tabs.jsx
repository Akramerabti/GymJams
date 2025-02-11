import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils"; // Ensure you have a class utility function

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
export const TabsContent = ({ className, ...props }) => (
  <TabsPrimitive.Content className={cn("p-4", className)} {...props} />
);
