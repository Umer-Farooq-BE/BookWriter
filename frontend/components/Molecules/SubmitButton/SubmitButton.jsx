'use client';

import { useFormStatus } from 'react-dom';
import { useFormContext } from 'react-hook-form';

import { LoaderIcon } from '@/Components/Atoms/Icons';

import Button from '@/Components/Atoms/Button';

const SubmitButton = ({
  children,
  isSuccessful,
  useReactHookForm = false, // Flag to determine which form system to use
  isLoading: externalIsLoading = false, // Rename to avoid conflicts
  ...buttonProps // Only pass valid button props
}) => {
  // For Next.js Server Actions
  const { pending: serverPending } = useFormStatus();
  
  // For react-hook-form
  let hookFormState = null;
  try {
    // Only call useFormContext if we're inside a FormProvider
    hookFormState = useReactHookForm ? useFormContext()?.formState : null;
  } catch (error) {
    // Not inside a FormProvider, use props instead
    hookFormState = null;
  }
  
  // Determine loading state based on form type
  const isLoading = useReactHookForm 
    ? (hookFormState?.isSubmitting || externalIsLoading)
    : serverPending;

  return (
    <Button
      type={isLoading ? 'button' : 'submit'}
      aria-disabled={isLoading || isSuccessful}
      disabled={isLoading || isSuccessful}
      className="relative"
      {...buttonProps}
    >
      {children}

      {(isLoading || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {isLoading || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
};

export default SubmitButton;