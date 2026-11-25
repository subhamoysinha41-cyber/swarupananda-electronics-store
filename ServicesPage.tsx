import { useState } from 'react';
import {
  Body1,
  Button,
  Card,
  Field,
  Input,
  Select,
  Subtitle1,
  Title1,
  Title3,
} from '@fluentui/react-components';
import {
  ArrowRightRegular,
  CheckmarkCircleRegular,
  GiftRegular,
  WrenchScrewdriverRegular,
} from '@fluentui/react-icons';
import { api } from '../api';
import { StateView } from '../components/StateView';
import { useApiData } from '../hooks/useApiData';
import { STORE_ADDRESS } from '../constants/store';

const demoImei = '354916820417269';

export function ServicesPage() {
  const { data: products, loading, error, retry } = useApiData(() => api.listProducts());
  const [repairDevice, setRepairDevice] = useState('Apple iPhone 15');
  const [repairImei, setRepairImei] = useState(demoImei);
  const [repairDetails, setRepairDetails] = useState('Display replacement');
  const [tradeDevice, setTradeDevice] = useState('Google Pixel 8');
  const [tradeImei, setTradeImei] = useState(demoImei);
  const [name, setName] = useState('Asha Rao');
  const [busy, setBusy] = useState<'repair' | 'trade-in' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const repairImeiValid = /^\d{15}$/.test(repairImei);
  const tradeImeiValid = /^\d{15}$/.test(tradeImei);

  const requestService = async (type: 'repair' | 'trade-in') => {
    const imei = type === 'repair' ? repairImei : tradeImei;
    if (!/^\d{15}$/.test(imei)) {
      setErrorMessage('Please enter a valid 15-digit IMEI before requesting service.');
      return;
    }
    setBusy(type);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.createServiceRequest({
        type,
        device: type === 'repair' ? repairDevice : tradeDevice,
        imei,
        details: type === 'repair' ? repairDetails : 'Trade-in valuation request',
        name,
      });
      setSuccessMessage(type === 'repair' ? 'Repair request received. Our team will be in touch shortly.' : 'Trade-in request received. We will confirm your estimate soon.');
    } catch (reason: unknown) {
      setErrorMessage(reason instanceof Error ? reason.message : 'We could not send your request. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const phoneOptions = (products ?? []).map((product) => `${product.brand} ${product.model}`);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div><span className="section-kicker">HERE FOR THE LONG RUN</span><Title1>Repair &amp; trade-in</Title1><Body1>Expert help for the phone you have, and a smoother start for the one you want.</Body1></div>
      </div>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="success-message" role="status"><CheckmarkCircleRegular />{successMessage}</p>}
      <StateView
        loading={loading}
        error={error}
        empty={(products ?? []).length === 0}
        onRetry={retry}
        onEmptyAction={() => { window.location.assign('/'); }}
        emptyActionLabel="Browse phones"
        emptyTitle="Service options are taking a break"
        emptyDescription="We need the phone catalog to show available devices. Try again or explore the store."
      >
        <div className="service-grid">
          <Card className="service-form-card" appearance="outline">
            <div className="service-card-heading">
              <span className="service-icon repair-icon"><WrenchScrewdriverRegular /></span>
              <div><span className="section-kicker">REPAIRS</span><Title3>Book a repair</Title3></div>
            </div>
            <Body1>Get a clear diagnosis and a careful repair from our service team.</Body1>
            <form className="form-stack" onSubmit={(event) => { event.preventDefault(); void requestService('repair'); }}>
              <Field label="Your name" required><Input value={name} onChange={(_, data) => setName(data.value)} /></Field>
              <Field label="Device" required>
                <Select value={repairDevice} onChange={(_, data) => setRepairDevice(data.value)}>
                  {phoneOptions.map((phone) => <option key={phone} value={phone}>{phone}</option>)}
                </Select>
              </Field>
              <Field label="Repair needed" required>
                <Select value={repairDetails} onChange={(_, data) => setRepairDetails(data.value)}>
                  <option value="Display replacement">Display replacement</option>
                  <option value="Battery service">Battery service</option>
                  <option value="Charging port repair">Charging port repair</option>
                </Select>
              </Field>
              <Field
                label="15-digit IMEI"
                required
                validationState="warning"
                validationMessage={repairImeiValid ? 'Please confirm this matches the IMEI printed on your device.' : 'Enter exactly 15 digits.'}
              >
                <Input inputMode="numeric" maxLength={15} value={repairImei} onChange={(_, data) => setRepairImei(data.value.replace(/\D/g, ''))} />
              </Field>
              <Button type="submit" appearance="primary" icon={<ArrowRightRegular />} disabled={busy !== null}>
                {busy === 'repair' ? 'Sending repair request…' : 'Request a repair'}
              </Button>
            </form>
            <div className="service-footnote">We will confirm an appointment time before any work begins.</div>
          </Card>

          <Card className="service-form-card trade-in-card" appearance="outline">
            <div className="service-card-heading">
              <span className="service-icon trade-icon"><GiftRegular /></span>
              <div><span className="section-kicker">TRADE-IN</span><Title3>See what yours is worth</Title3></div>
            </div>
            <Body1>Get an estimate and let our team guide you through the next steps.</Body1>
            <form className="form-stack" onSubmit={(event) => { event.preventDefault(); void requestService('trade-in'); }}>
              <Field label="Device" required>
                <Select value={tradeDevice} onChange={(_, data) => setTradeDevice(data.value)}>
                  {phoneOptions.map((phone) => <option key={phone} value={phone}>{phone}</option>)}
                </Select>
              </Field>
              <Field label="Storage" required>
                <Select defaultValue="128 GB">
                  <option value="128 GB">128 GB</option>
                  <option value="256 GB">256 GB</option>
                </Select>
              </Field>
              <Field
                label="15-digit IMEI"
                required
                validationState="warning"
                validationMessage={tradeImeiValid ? 'Double-check your IMEI before requesting a quote.' : 'Enter exactly 15 digits.'}
              >
                <Input inputMode="numeric" maxLength={15} value={tradeImei} onChange={(_, data) => setTradeImei(data.value.replace(/\D/g, ''))} />
              </Field>
              <Card className="estimate-card" appearance="filled-alternative">
                <span>ESTIMATED TRADE-IN VALUE</span>
                <strong>Rs 18,500</strong>
                <small>Google Pixel 8 · 128 GB · subject to inspection</small>
              </Card>
              <Button type="submit" appearance="primary" icon={<ArrowRightRegular />} disabled={busy !== null}>
                {busy === 'trade-in' ? 'Requesting your quote…' : 'Get my trade-in quote'}
              </Button>
            </form>
            <div className="service-footnote">Final valuation depends on a quick in-store condition check.</div>
          </Card>
        </div>
      </StateView>
      <Card className="service-promise">
        <CheckmarkCircleRegular />
        <div><Subtitle1>Real people, right here in Contai</Subtitle1><Body1>Visit our showroom at {STORE_ADDRESS} for support and live product demos.</Body1></div>
      </Card>
    </div>
  );
}
