import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils"; // Ensure you have a utility function for classnames

// Root component for the dialog
export const Dialog = DialogPrimitive.Root;

// Trigger component to open the dialog
export const DialogTrigger = DialogPrimitive.Trigger;

// Close component to close the dialog
export const DialogClose = DialogPrimitive.Close;

// Content component for the dialog
export const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/40" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-[9999] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-4 focus:outline-none",
          className
        )}
        style={{
          background: 'white',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 z-[10000] text-gray-500 hover:text-gray-700">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

// Header component for the dialog
export const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn("mb-4 text-xl font-bold", className)} {...props}>
    {children}
  </div>
);

// Title component for the dialog
export const DialogTitle = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

// Description component for the dialog
export const DialogDescription = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  )
);

DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Body component for the dialog (for main content)
export const DialogBody = ({ className, children, ...props }) => (
  <div className={cn("mb-6", className)} {...props}>
    {children}
  </div>
);

// Footer component for the dialog (for actions like buttons)
export const DialogFooter = ({ className, children, ...props }) => (
  <div className={cn("flex justify-end gap-2", className)} {...props}>
    {children}
  </div>
);