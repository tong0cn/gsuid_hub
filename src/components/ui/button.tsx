import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 [&_svg]:text-primary-foreground [&_svg]:!text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 [&_svg]:text-destructive-foreground [&_svg]:!text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground [&_svg]:text-foreground [&_svg]:!text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 [&_svg]:text-secondary-foreground [&_svg]:!text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground [&_svg]:text-foreground [&_svg]:!text-foreground",
        link: "text-primary underline-offset-4 hover:underline [&_svg]:text-primary [&_svg]:!text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Process children to force icon colors to inherit using inline styles (highest priority)
    const processChildren = (children: React.ReactNode): React.ReactNode => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Check if it's an icon component
          const isIcon =
            (child.props.className && child.props.className.includes('lucide')) ||
            typeof child.type === 'function' && child.type.name &&
            (child.type.name.startsWith('Lucide') || child.type.name.match(/[A-Z][a-z]+/));
          
          if (isIcon) {
            // Force color: inherit with inline style (highest priority)
            return React.cloneElement(child as React.ReactElement, {
              style: {
                ...(child as React.ReactElement).props.style,
                color: 'inherit',
              },
            });
          }
          // Recursively process nested children
          if (child.props.children) {
            return React.cloneElement(child as React.ReactElement, {
              children: processChildren(child.props.children),
            });
          }
        }
        return child;
      });
    };
    
    const processedChildren = processChildren(props.children);
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        children={processedChildren}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
