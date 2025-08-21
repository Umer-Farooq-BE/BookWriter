'use client';

import { usePathname } from 'next/navigation';
import Header from '../Header';

const ConditionalHeader = () => {
  const pathname = usePathname();
  
const noHeaderPages = ['/signup', '/login', '/home'];
const isHomeDynamicPage = pathname.startsWith('/home/');
const isAuthPage = noHeaderPages.includes(pathname);
  if (isAuthPage || isHomeDynamicPage) {
    return null;
  }
  
  return <Header />;
};

export default ConditionalHeader;
