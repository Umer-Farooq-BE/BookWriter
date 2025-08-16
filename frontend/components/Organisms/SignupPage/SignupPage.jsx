

'use client';

import InputField from "../../Atoms/InputField";
import { PrimaryButton } from "../../Atoms/Button";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './SignupPage.module.css';
import PasswordField from "../../Atoms/PasswordField/PasswordField";

export default function SignupPage() {
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

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });
  
  const onSubmit = data => {
    console.log(data);
  };

  return (
    <div className={styles?.signupContainer}>
      <div className={styles?.signupCard}>
        <div className={styles?.header}>
          <h1 className={styles?.title}>Create Your Account</h1>
          <p className={styles?.subtitle}>Join Book Writer Pro and start your writing journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles?.form}>
          <div className={styles?.formRow}>
            <InputField
              label="First Name *" 
              type="text" 
              name="firstName" 
              register={register} 
              errors={errors} 
            />
            <InputField 
              label="Last Name *" 
              type="text" 
              name="lastName" 
              register={register} 
              errors={errors} 
            />
          </div>
          
          <InputField 
            label="Username *" 
            type="text" 
            name="userName" 
            register={register} 
            errors={errors} 
          />
          
          <InputField 
            label="Email *" 
            type="email" 
            name="email" 
            register={register} 
            errors={errors} 
          />
          
          <PasswordField 
            label="Password *" 
            name="password" 
            register={register} 
            errors={errors} 
          />

          <PasswordField 
            label="Confirm Password *" 
            name="confirmPassword" 
            register={register} 
            errors={errors} 
          />
          
          <PrimaryButton 
            type="submit" 
            className={styles?.submitButton}
            fullWidth
          >
            Create Account
          </PrimaryButton>
        </form>

        <div className={styles?.footer}>
          <p>Already have an account? <a href="/login" className={styles?.loginLink}>Sign in</a></p>
        </div>
      </div>
    </div>
  );
};