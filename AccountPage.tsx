import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Card,
  Field,
  Input,
  Title1,
  Title3,
} from '@fluentui/react-components';
import { ArrowRightRegular, PersonRegular, ShieldCheckmarkRegular } from '@fluentui/react-icons';
import { useAuth } from '../components/AuthProvider';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, ready, signIn, signOut } = useAuth();
  const [phone, setPhone] = useState('+91 98765 43210');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn({ phone, password });
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <Card className="account-loading"><span className="section-kicker">YOUR ACCOUNT</span><Title3>Preparing your account…</Title3></Card>;
  }

  if (user) {
    return (
      <div className="page-stack">
        <div className="page-title-row"><div><span className="section-kicker">YOUR ACCOUNT</span><Title1>Welcome back, {user.name.split(' ')[0]}</Title1></div></div>
        <div className="account-grid">
          <Card className="account-profile-card">
            <Avatar name={user.name} size={64} color="brand" />
            <div><Title3>{user.name}</Title3><Body1>{user.phone}</Body1><Body1>{user.email}</Body1></div>
            <div className="account-trust"><ShieldCheckmarkRegular /><span>Your demo account is signed in securely.</span></div>
          </Card>
          <Card className="account-benefits-card">
            <PersonRegular className="section-icon" />
            <Title3>Everything in one place</Title3>
            <Body1>Track your orders, keep service requests close, and get help from our local team.</Body1>
            <Button appearance="primary" icon={<ArrowRightRegular />} onClick={() => navigate('/services')}>Explore repair &amp; trade-in</Button>
            <Button appearance="subtle" onClick={() => void signOut()}>Sign out of your account</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><span className="section-kicker">YOUR ACCOUNT</span><Title1>Sign in to your account</Title1></div></div>
      <div className="account-grid">
        <Card className="account-auth-card">
          <div className="panel-title"><PersonRegular /><Title3>Welcome back</Title3></div>
          <Body1>Sign in to track orders and service requests.</Body1>
          <form onSubmit={(event) => void handleSignIn(event)} className="form-stack">
            <Field label="Mobile number" required>
              <Input type="tel" autoComplete="tel" value={phone} onChange={(_, data) => setPhone(data.value)} />
            </Field>
            <Field label="Password" required>
              <Input type="password" autoComplete="current-password" value={password} onChange={(_, data) => setPassword(data.value)} />
            </Field>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" appearance="primary" disabled={busy} icon={<ArrowRightRegular />}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="demo-hint">Preview sign-in: +91 98765 43210 · any password</p>
        </Card>
        <Card className="account-create-card">
          <span className="section-kicker">NEW TO MOBILESTORE?</span>
          <Title3>Create an account</Title3>
          <Body1>Make checkout quicker and keep your repairs and trade-in requests together.</Body1>
          <Button appearance="primary" icon={<ArrowRightRegular />} onClick={() => navigate('/create-account')}>Create account</Button>
          <div className="account-reassurance"><ShieldCheckmarkRegular /><span>Your details stay private and protected.</span></div>
        </Card>
      </div>
    </div>
  );
}

export function CreateAccountPage() {
  const navigate = useNavigate();
  const { createAccount } = useAuth();
  const [name, setName] = useState('Asha Rao');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('asha@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setBusy(true);
    try {
      await createAccount({ name, phone, email, password });
      setSuccess(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'We could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-title-row"><div><span className="section-kicker">JOIN MOBILESTORE</span><Title1>Create your account</Title1></div></div>
      <div className="auth-page-layout">
        <Card className="account-auth-card">
          <Title3>Your details</Title3>
          <Body1>One account for purchases, repairs and trade-ins.</Body1>
          {success ? (
            <div className="account-success" role="status">
              <ShieldCheckmarkRegular className="state-icon" />
              <Title3>You're all set, {name.split(' ')[0]}.</Title3>
              <Body1>Your account has been created and you are now signed in.</Body1>
              <Button appearance="primary" onClick={() => navigate('/account')}>View your account</Button>
            </div>
          ) : (
            <form onSubmit={(event) => void handleCreate(event)} className="form-stack">
              <Field label="Full name" required>
                <Input autoComplete="name" value={name} onChange={(_, data) => setName(data.value)} />
              </Field>
              <Field label="Mobile number" required>
                <Input type="tel" autoComplete="tel" value={phone} onChange={(_, data) => setPhone(data.value)} />
              </Field>
              <Field label="Email address" required>
                <Input type="email" autoComplete="email" value={email} onChange={(_, data) => setEmail(data.value)} />
              </Field>
              <Field
                label="Create a password"
                required
                validationState={password.length > 0 && password.length < 8 ? 'warning' : 'none'}
                validationMessage={password.length > 0 && password.length < 8 ? 'Use at least 8 characters.' : undefined}
              >
                <Input type="password" autoComplete="new-password" value={password} onChange={(_, data) => setPassword(data.value)} />
              </Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <Button type="submit" appearance="primary" disabled={busy}>{busy ? 'Creating your account…' : 'Create account'}</Button>
            </form>
          )}
          <p className="demo-hint">Already have an account? <button className="text-link" type="button" onClick={() => navigate('/account')}>Sign in</button></p>
        </Card>
        <Card className="account-side-card">
          <ShieldCheckmarkRegular className="section-icon" />
          <Title3>A little more peace of mind</Title3>
          <Body1>Your profile makes it easy to manage an order, book a screen repair, or get a trade-in quote from our Contai team.</Body1>
        </Card>
      </div>
    </div>
  );
}
