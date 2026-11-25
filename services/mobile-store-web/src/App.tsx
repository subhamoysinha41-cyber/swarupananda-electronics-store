import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { createDarkTheme, createLightTheme, FluentProvider, type BrandVariants } from '@fluentui/react-components';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './components/AuthProvider';
import { PreviewStateSwitcher } from './components/PreviewStateSwitcher';
import { AccountPage, CreateAccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { ServicesPage } from './pages/ServicesPage';
import { StorefrontPage } from './pages/StorefrontPage';
import './styles.css';

function blend(hex: string, target: string, amount: number): string {
  const from = hex.replace('#', '').match(/.{2}/g)?.map((part) => parseInt(part, 16)) ?? [18, 59, 102];
  const to = target.replace('#', '').match(/.{2}/g)?.map((part) => parseInt(part, 16)) ?? [255, 255, 255];
  return `#${from.map((part, index) => Math.round(part + ((to[index] ?? 0) - part) * amount)
    .toString(16).padStart(2, '0')).join('')}`;
}

function makeBrandRamp(): BrandVariants {
  const steps = [0.92, 0.84, 0.76, 0.68, 0.58, 0.46, 0.32, 0.18, 0, 0.1, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8];
  const keys = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160] as const;
  return Object.fromEntries(keys.map((key, index) => [
    key,
    index < 8 ? blend('#123B66', '#ffffff', steps[index]) : blend('#123B66', '#020b18', steps[index]),
  ])) as BrandVariants;
}

const brandRamp = makeBrandRamp();
const lightTheme = createLightTheme(brandRamp);
const darkTheme = createDarkTheme(brandRamp);
const shopTeamBackground = `url("${import.meta.env.BASE_URL}shop-team-background.jpeg")`;
lightTheme.fontFamilyBase = '"Segoe UI", Inter, system-ui, sans-serif';
darkTheme.fontFamilyBase = '"Segoe UI", Inter, system-ui, sans-serif';

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = window.localStorage.getItem('app-theme');
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'light';
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    window.localStorage.setItem('app-theme', mode);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark);
  }, [dark]);

  const toggleTheme = useMemo(() => () => setMode(dark ? 'light' : 'dark'), [dark]);

  return (
    <FluentProvider
      theme={dark ? darkTheme : lightTheme}
      className={dark ? 'fluent-root theme-dark' : 'fluent-root'}
      style={{ '--shop-team-background': shopTeamBackground } as CSSProperties}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ThemeBridge dark={dark} onToggle={toggleTheme} />
          <PreviewStateSwitcher />
        </AuthProvider>
      </BrowserRouter>
    </FluentProvider>
  );
}

function ThemeBridge({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return <RouteMotionBridge dark={dark} onToggle={onToggle} />;
}

function RouteMotionBridge({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="route-motion"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        <Routes>
          <Route element={<AppShell dark={dark} onToggleTheme={onToggle} />}>
            <Route index element={<StorefrontPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="create-account" element={<CreateAccountPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
