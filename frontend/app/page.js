'use client'
import Image from "next/image"
import Link from "next/link";
import { useState, useEffect } from 'react';
import logo from '@/public/assets/logo.png'; 
import { isUserAuthenticated } from '@/utils/auth';

const Home = () =>   {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    setIsLoggedIn(isUserAuthenticated());
    setIsLoading(false);

    // Listen for auth status changes
    const handleAuthChange = () => {
      setIsLoggedIn(isUserAuthenticated());
    };

    window.addEventListener('authStatusChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStatusChanged', handleAuthChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image 
              src={logo} 
              alt="Book Writer Pro Logo" 
              width={120} 
              height={120}
              className="rounded-xl shadow-lg"
            />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="block text-foreground">Let's start writing</span>
              <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                your new book
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Book Writer Pro GPT is a powerful AI-driven system that helps you turn your ideas into a professionally written book in as little as one hour — no writing experience needed.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
            <div className="p-6 rounded-lg bg-card border border-border text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground">AI-Powered Writing</h3>
              <p className="text-sm text-muted-foreground">From titles and outlines to full chapters</p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Complete book in as little as one hour</p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-card-foreground">No Experience Needed</h3>
              <p className="text-sm text-muted-foreground">Publish with confidence, no writing skills required</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Link 
              href="/home"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-3 text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Write New Book
            </Link>
          </div>

          {/* Secondary Actions */}
          {isLoggedIn ? (
            // Show welcome message for logged-in users
            <div className="flex flex-col items-center justify-center gap-2 pt-6 text-sm">
              <span className="text-muted-foreground">Welcome back! Ready to create something amazing?</span>
              <Link 
                href="/profile" 
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View Profile
              </Link>
            </div>
          ) : (
            // Show sign up encouragement for non-logged-in users
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 text-sm">
              <span className="text-muted-foreground">Join thousands of authors already using our platform</span>
              <div className="flex gap-4">
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-primary">Free trial included</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            Transform your ideas into professionally written books with the power of AI
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;