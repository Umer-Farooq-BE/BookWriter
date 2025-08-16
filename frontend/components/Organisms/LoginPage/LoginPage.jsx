'use client';

import InputField from "../../Atoms/InputField";
import { PrimaryButton } from "../../Atoms/Button";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './LoginPage.module.css';
import PasswordField from "../../Atoms/PasswordField/PasswordField";

export default function LoginPage() {
  const defaultValues = {
    email: '',
    password: ''
  };
  
  const schema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });
  
  const onSubmit = data => {
    console.log(data);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your Book Writer Pro account</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
          
          <PrimaryButton 
            type="submit" 
            className={styles.submitButton}
            fullWidth
          >
            Sign In
          </PrimaryButton>
        </form>
        
        <div className={styles.footer}>
          <p>Don&apos;t have an account? <a href="/signup" className={styles.signupLink}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
};