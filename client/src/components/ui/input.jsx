import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ 
  className, 
  type = "text",
  error, // keep for className only
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-offset-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-500",
        "[&::-webkit-input-placeholder]:text-gray-500 dark:[&::-webkit-input-placeholder]:text-gray-400",
        "[&>svg]:text-gray-500 dark:[&>svg]:text-white",
        error && "border-red-500 focus-visible:ring-red-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }