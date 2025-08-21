'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';

import { cn } from '@/libs/utils';

const labelVariants = cva(
  'text-sm font-normal leading-none text-zinc-600 dark:text-zinc-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef(({ className, children, error, required, ...domProps }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...domProps}
  >
    {children}
    {(error || required) && <span className="text-red-500 ml-1">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export default Label;