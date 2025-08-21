'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../Sidebar/Sidebar';
import { useAuthStatus } from './hooks/useAuthStatus';
import { useSidebar} from './hooks/useSidebar';
import { useSidebarBodyClass } from './hooks/useSidebarBodyClass';

const ConditionalSidebar = () => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const sidebarCollapsed = useSidebar();

  const NO_SIDEBAR_PAGES = ['/login', '/signup'];
  const SIDEBAR_PAGES = ['/home', '/userDetail'];
  const isHomeDynamicPage = pathname.startsWith('/home/');

  const shouldShowSidebar =
    (SIDEBAR_PAGES.includes(pathname) || isHomeDynamicPage) &&
    !NO_SIDEBAR_PAGES.includes(pathname);

  const sidebarActive = isAuthenticated && shouldShowSidebar && !isLoading;

  useSidebarBodyClass(sidebarActive, sidebarCollapsed);

  if (!sidebarActive) {
    return null;
  }

  return <Sidebar />;
};

export default ConditionalSidebar;