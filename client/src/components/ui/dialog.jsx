import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils"; // Ensure you have a utility function for classnames

// Root component for the dialog
export const Dialog = DialogPrimitive.Root;

// Trigger component to open the dialog
export const DialogTrigger = DialogPrimitive.Trigger;

// Close component to close the dialog
export const DialogClose = DialogPrimitive.Close;

// Content component for the dialog
export const DialogContent = ({ className, children, ...props }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
        <X size={18} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

// Header component for the dialog
export const DialogHeader = ({ className, children, ...props }) => (
  <div className={cn("mb-4 text-xl font-bold", className)} {...props}>
    {children}
  </div>
);

// Title component for the dialog
export const DialogTitle = DialogPrimitive.Title;

// Description component for the dialog
export const DialogDescription = DialogPrimitive.Description;

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