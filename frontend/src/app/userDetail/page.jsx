'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from '../page.module.css';
import { createUser } from '../../../utils/api';
import Image from 'next/image';
import logo from '../../../public/assets/logo.png';
import InputField from '../../../components/Atoms/InputField';
import { PrimaryButton } from '../../../components/Atoms/Button';

export default function UserDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const isApiSheets = pathname === '/api/sheets';

    if (!isApiSheets && storedName && storedEmail) {
      router.replace('/');
    }
  }, [router, pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    try {
      const user = await createUser(name, email);
      if (user && user._id) {
        localStorage.setItem('userId', user._id);
      }
    } catch (err) {
      console.error('Failed to save user', err);
    }
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    router.push('/');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image src={logo} alt="Logo" width={180} />
        <h1 className={styles.title}>Please Fill in the form to continue with the app</h1>
        <div className={`mb-4 ${styles.subTitle}`}>
          Book Writer Pro GPT is a powerful AI-driven system that helps you turn your ideas into a professionally written book in less than 7 days — no writing experience needed. From titles and outlines to full chapters, it does the heavy lifting so you can finally publish your story with confidence
        </div>
        
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3" style={{ maxWidth: '400px', width: '100%' }}>
          <InputField
            label="Your Name *"
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <InputField
            label="Your Email *"
            type="email"
            name="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <PrimaryButton 
            type="submit" 
            fullWidth
            className="mt-3"
          >
            Continue
          </PrimaryButton>
        </form>
      </main>
    </div>
  );
}
