import * as React from 'react';

import { cn } from '@/libs/utils';

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full min-w-0 rounded-md border bg-muted px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        // Error state styling
        error 
          ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' 
          : 'border-input focus-visible:border-ring focus-visible:ring-ring',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export default Input;