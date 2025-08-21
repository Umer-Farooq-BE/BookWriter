'use client'
import  Input  from '@/Components/Atoms/InputField/InputField';
import Label from '@/Components/Atoms/Label';
import ErrorMessage from '@/Components/Atoms/ErrorMessage';
import SubmitButton from '@/Components/Molecules/SubmitButton';
import { zodResolver } from '@hookform/resolvers/zod';
import Form from 'next/form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const AuthFormSignIn =({}) =>{

   const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const schema = z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required'),
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onBlur'
  });
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();

    try {
      console.log('Login data:', data);
      
      // Simulate API call - replace with your actual login logic
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('root.serverError', {
            type: 'manual',
            message: 'Invalid email or password',
          });
          toast({
            type: 'error',
            description: 'Invalid email or password. Please try again.',
          });
        } else if (response.status === 429) {
          setError('root.serverError', {
            type: 'manual',
            message: 'Too many attempts. Please try again later.',
          });
          toast({
            type: 'error',
            description: 'Too many login attempts. Please try again later.',
          });
        } else {
          throw new Error('Login failed');
        }
        return;
      }

      const result = await response.json();
      
      toast({
        type: 'success',
        description: 'Login successful! Redirecting...',
      });

      // Store token if provided
      if (result?.token) {
        localStorage.setItem('authToken', result?.token);
      }

      reset();
      
      setTimeout(() => {
        router.push('/home');
        router.refresh();
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setError('root.serverError', {
        type: 'manual',
        message: 'Something went wrong. Please try again.',
      });
      toast({
        type: 'error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormError = (errors) => {
    console.log('Form validation errors:', errors);
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      console.log('First form error:', firstError);
      toast(firstError?.message,{
        type: 'error',
      });
    }
  };
  return (
    <Form
      onSubmit={handleSubmit(onSubmit, handleFormError)}
      className="flex flex-col gap-4 px-4 sm:px-16 w-full max-w-full overflow-hidden"
      noValidate
    >
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              error={!!errors?.email}
            >
              Email Address
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="user@acme.com"
              autoComplete="email"
              autoFocus
              error={!!errors?.email}
              {...register('email')}
              aria-invalid={errors?.email ? 'true' : 'false'}
              aria-describedby={errors?.email ? 'email-error' : undefined}
            />
            
            <ErrorMessage id="email-error">
              {errors?.email?.message}
            </ErrorMessage>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              error={!!errors?.password}
            >
              Password
            </Label>

            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={!!errors?.password}
              {...register('password')}
              aria-invalid={errors?.password ? 'true' : 'false'}
              aria-describedby={errors?.password ? 'password-error' : undefined}
            />
            
            <ErrorMessage id="password-error">
              {errors?.password?.message}
            </ErrorMessage>
          </div>

          {/* Server Error Display */}
          {errors?.root?.serverError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800" role="alert">
                {errors?.root?.serverError?.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <SubmitButton
            useReactHookForm={true}
            isLoading={isLoading}
            isSuccessful={false}
          >
            Sign in
          </SubmitButton>

          {/* Sign up link */}
         
        </Form>
  );
}

export default AuthFormSignIn;