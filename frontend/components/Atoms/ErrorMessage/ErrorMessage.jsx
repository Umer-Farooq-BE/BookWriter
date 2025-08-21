import * as React from 'react';
import { cn } from '@/libs/utils';

const ErrorMessage = React.forwardRef(({ 
  className, 
  children, 
  id,
  ...props 
}, ref) => {
  if (!children) return null;

  return (
    <p 
      id={id}
      className={cn(
        'text-sm text-red-600 mt-1 break-words overflow-wrap-anywhere max-w-full',
        className
      )}
      role="alert"
      ref={ref}
      {...props}
    >
      {children}
    </p>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
