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

const AuthFormSignUp =({}) =>{
  const defaultValues = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  const schema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    userName: z.string().min(1, 'Username is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


  

   const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

 

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  });
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();

    try {
      console.log('Signup data:', data);
      
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...signupData } = data;
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError('root.serverError', {
            type: 'manual',
            message: 'Email or username already exists',
          });
          toast({
            type: 'error',
            description: 'Email or username already exists. Please try different credentials.',
          });
        } else if (response.status === 400) {
          setError('root.serverError', {
            type: 'manual',
            message: 'Invalid registration data',
          });
          toast({
            type: 'error',
            description: 'Please check your information and try again.',
          });
        } else {
          throw new Error('Signup failed');
        }
        return;
      }

      const result = await response.json();
      
      toast({
        type: 'success',
        description: 'Account created successfully! Please sign in.',
      });

      reset();
      
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 1000);

    } catch (error) {
      console.error('Signup error:', error);
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
          {/* First Name Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="firstName"
              error={!!errors?.firstName}
            >
              First Name
            </Label>

            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              autoFocus
              error={!!errors?.firstName}
              {...register('firstName')}
              aria-invalid={errors?.firstName ? 'true' : 'false'}
              aria-describedby={errors?.firstName ? 'firstName-error' : undefined}
            />
            
            <ErrorMessage id="firstName-error">
              {errors?.firstName?.message}
            </ErrorMessage>
          </div>

          {/* Last Name Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="lastName"
              error={!!errors?.lastName}
            >
              Last Name
            </Label>

            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              error={!!errors?.lastName}
              {...register('lastName')}
              aria-invalid={errors?.lastName ? 'true' : 'false'}
              aria-describedby={errors?.lastName ? 'lastName-error' : undefined}
            />
            
            <ErrorMessage id="lastName-error">
              {errors?.lastName?.message}
            </ErrorMessage>
          </div>

          {/* Username Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="userName"
              error={!!errors?.userName}
            >
              Username
            </Label>

            <Input
              id="userName"
              type="text"
              placeholder="johndoe123"
              autoComplete="username"
              error={!!errors?.userName}
              {...register('userName')}
              aria-invalid={errors?.userName ? 'true' : 'false'}
              aria-describedby={errors?.userName ? 'userName-error' : undefined}
            />
            
            <ErrorMessage id="userName-error">
              {errors?.userName?.message}
            </ErrorMessage>
          </div>

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
              autoComplete="new-password"
              error={!!errors?.password}
              {...register('password')}
              aria-invalid={errors?.password ? 'true' : 'false'}
              aria-describedby={errors?.password ? 'password-error' : undefined}
            />
            
            <ErrorMessage id="password-error">
              {errors?.password?.message}
            </ErrorMessage>
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirmPassword"
              error={!!errors?.confirmPassword}
            >
              Confirm Password
            </Label>

            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              error={!!errors?.confirmPassword}
              {...register('confirmPassword')}
              aria-invalid={errors?.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors?.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            
            <ErrorMessage id="confirmPassword-error">
              {errors?.confirmPassword?.message}
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
            Create Account
          </SubmitButton>

          {/* Sign in link */}
         
        </Form>
  );
}

export default AuthFormSignUp;