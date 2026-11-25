import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Divider,
  Tab,
  TabList,
  Toolbar,
  Tooltip,
} from '@fluentui/react-components';
import {
  CartRegular,
  HomeRegular,
  PersonRegular,
  WrenchScrewdriverRegular,
  WindowDevToolsRegular,
} from '@fluentui/react-icons';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { STORE_ADDRESS } from '../constants/store';

type AppShellProps = { dark: boolean; onToggleTheme: () => void };

export function AppShell({ dark, onToggleTheme }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, ready, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const selectedTab = location.pathname.startsWith('/cart')
    ? 'cart'
    : location.pathname.startsWith('/services')
      ? 'services'
      : location.pathname.startsWith('/account') || location.pathname.startsWith('/create-account')
        ? 'account'
        : location.pathname.startsWith('/admin')
          ? 'admin'
          : 'store';

  const onSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (reason: unknown) {
      setSignOutError(reason instanceof Error ? reason.message : 'Could not sign out. Try again.');
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <Toolbar className="header-toolbar" aria-label="SWARUPANANDA ELECTRONICS header">
          <RouterLink to="/" className="brand-lockup" aria-label="SWARUPANANDA ELECTRONICS home">
            <span className="brand-mark"><WindowDevToolsRegular /></span>
            <span className="brand-name">SWARUPANANDA ELECTRONICS</span>
          </RouterLink>
          <div className="header-right">
            <span className="header-assurance">Mobile · TV · Fridge · AC Showroom</span>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            {ready && user ? (
              <Tooltip content={`Signed in as ${user.name}`} relationship="label">
                <Button appearance="subtle" className="account-shortcut" onClick={() => navigate('/account')}>
                  <Avatar name={user.name} size={28} />
                  <span>{user.name.split(' ')[0]}</span>
                </Button>
              </Tooltip>
            ) : (
              <Button appearance="subtle" icon={<PersonRegular />} onClick={() => navigate('/account')}>Sign in</Button>
            )}
            {user && (
              <Button appearance="outline" className="sign-out-button" onClick={() => void onSignOut()}>Sign out</Button>
            )}
          </div>
        </Toolbar>
        {signOutError && <p className="header-error" role="alert">{signOutError}</p>}
      </header>
      <nav className="site-navigation" aria-label="Main navigation">
        <TabList selectedValue={selectedTab} className="nav-tabs">
          <Tab value="store" aria-label="Store" icon={<HomeRegular />} onClick={() => navigate('/')}>Store</Tab>
          <Tab value="cart" aria-label="Cart" icon={<CartRegular />} onClick={() => navigate('/cart')}>Cart</Tab>
          <Tab value="services" aria-label="Repairs and trade-in" icon={<WrenchScrewdriverRegular />} onClick={() => navigate('/services')}>Repairs &amp; trade-in</Tab>
          <Tab value="account" aria-label="Account" icon={<PersonRegular />} onClick={() => navigate('/account')}>Account</Tab>
          <Tab value="admin" aria-label="Admin" icon={<WindowDevToolsRegular />} onClick={() => navigate('/admin')}>Admin</Tab>
        </TabList>
      </nav>
      <main className="page-main"><Outlet /></main>
      <footer className="site-footer">
        <Divider />
        <div className="footer-row">
          <span>© 2026 SWARUPANANDA ELECTRONICS</span>
          <span>{STORE_ADDRESS}</span>
          <span>Owner: NIRMAL SAHOO</span>
          <RouterLink to="/services">Visit our service hub</RouterLink>
        </div>
      </footer>
    </div>
  );
}
