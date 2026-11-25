import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Badge,
  Body1,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Subtitle1,
  Tab,
  TabList,
  Text,
  Title1,
  Title3,
} from '@fluentui/react-components';
import {
  ArrowRightRegular,
  CartRegular,
  CheckmarkCircleRegular,
  EyeRegular,
  LocationRegular,
  SearchRegular,
  WrenchScrewdriverRegular,
} from '@fluentui/react-icons';
import { api } from '../api';
import type { Product } from '../api/types';
import { StateView } from '../components/StateView';
import { useApiData } from '../hooks/useApiData';
import { STORE_ADDRESS } from '../constants/store';

const brands = ['All', 'Samsung', 'Apple', 'OnePlus', 'Xiaomi', 'Google', 'Realme', 'Vivo', 'Oppo'];
const inr = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;
const vivoPrebookUrl = `https://wa.me/919876543210?text=${encodeURIComponent('Hi, I would like to know about Vivo X500 Series pre-booking and the special offer.')}`;

function ProductTile({ product, onAdd, onView3D }: { product: Product; onAdd: (product: Product) => void; onView3D: (product: Product) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="product-motion"
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="product-card" appearance="outline">
        <CardPreview className="product-image-wrap">
          <img className="product-image" src={product.image} alt={`${product.brand} ${product.model}`} loading="lazy" />
          {product.badge && <Badge className="product-badge" color="brand">{product.badge}</Badge>}
        </CardPreview>
        <CardHeader
          header={<Subtitle1 className="product-title">{product.brand} {product.model}</Subtitle1>}
          description={<Body1 className="product-specs">{product.ram} RAM <span>·</span> {product.storage} <span>·</span> {product.battery}</Body1>}
        />
        <div className="product-price-row">
          <strong>{inr(product.price)}</strong>
          <span><CheckmarkCircleRegular /> Genuine warranty</span>
        </div>
        <CardFooter className="product-actions">
          <Button appearance="primary" icon={<CartRegular />} onClick={() => onAdd(product)}>Add to cart</Button>
          <Button appearance="subtle" icon={<EyeRegular />} aria-label={`View ${product.brand} ${product.model} in 3D`} onClick={() => onView3D(product)}>3D view</Button>
          <Button
            appearance="subtle"
            as="a"
            href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi, I'm interested in the ${product.brand} ${product.model}.`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ask about ${product.brand} ${product.model} on WhatsApp`}
          >
            Ask us
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function Phone3DDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [rotation, setRotation] = useState(0);
  const angle = ((rotation % 360) + 360) % 360;
  const visibleSide = angle >= 90 && angle < 270 ? 'Back' : 'Front';

  return (
    <Dialog open onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface className="phone-preview-surface">
        <DialogBody>
          <DialogTitle>View {product.brand} {product.model} in 3D</DialogTitle>
          <DialogContent>
            <div className="phone-preview-content">
              <div className="phone-model-stage" role="img" aria-label={`${product.brand} ${product.model} interactive 3D-style phone model`}>
                <div className="phone-model" style={{ transform: `rotateX(-5deg) rotateY(${rotation}deg)` }}>
                  <div className="phone-model-face phone-model-front">
                    <div className="phone-model-screen">
                      <span className="phone-model-camera" />
                      <small>{product.brand}</small>
                      <strong>{product.model}</strong>
                      <span className="phone-model-screen-time">10:08</span>
                    </div>
                  </div>
                  <div className="phone-model-face phone-model-back">
                    <div className="phone-camera-module" aria-hidden="true"><i /><i /><i /></div>
                    <span className="phone-model-back-brand">{product.brand}</span>
                    <small>{product.model}</small>
                  </div>
                  <span className="phone-model-edge phone-model-edge-left" />
                  <span className="phone-model-edge phone-model-edge-right" />
                  <span className="phone-model-edge phone-model-edge-top" />
                  <span className="phone-model-edge phone-model-edge-bottom" />
                </div>
              </div>
              <label className="phone-rotation-control" htmlFor={`phone-rotation-${product.id}`}>
                <span>Rotate the phone · {visibleSide} view</span>
                <input
                  id={`phone-rotation-${product.id}`}
                  aria-label="Rotate phone"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                />
              </label>
              <Text className="phone-model-disclaimer">Illustrative 3D-style model for preview. Actual phone design and color may differ.</Text>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setRotation(0)}>Front view</Button>
            <Button appearance="secondary" onClick={() => setRotation(180)}>Back view</Button>
            <Button appearance="primary" onClick={onClose}>Close</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

export function StorefrontPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const { data: products, loading, error, retry } = useApiData(() => api.listProducts(search), [search]);
  const visibleProducts = (products ?? []).filter((product) => selectedBrand === 'All' || product.brand === selectedBrand);

  const addProduct = async (product: Product) => {
    setNotice(null);
    try {
      await api.addToCart(product.id);
      setNotice(`${product.brand} ${product.model} added to your cart.`);
    } catch (reason: unknown) {
      setNotice(reason instanceof Error ? reason.message : 'We could not add this phone. Please try again.');
    }
  };

  return (
    <div className="storefront-page page-stack">
      <section className="hero-card" aria-labelledby="hero-title">
        <svg className="hero-mesh" aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="none">
          <defs>
            <radialGradient id="hero-glow-accent" cx="0%" cy="0%" r="80%">
              <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-glow-primary" cx="100%" cy="100%" r="80%">
              <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="400" fill="url(#hero-glow-accent)" />
          <rect width="800" height="400" fill="url(#hero-glow-primary)" />
        </svg>
        <Card appearance="filled-alternative" className="hero-content">
          <span className="hero-eyebrow"><span className="eyebrow-dot" /> NEW ARRIVALS · CONTAI</span>
          <Title1 id="hero-title" className="hero-title">Phones, TVs &amp;<br />home essentials.</Title1>
          <Body1 className="hero-description">Discover mobile deals and ask our Satmail team about TVs, refrigerators and air conditioners.</Body1>
          <div className="hero-actions">
            <Button appearance="primary" icon={<ArrowRightRegular />} onClick={() => document.getElementById('phones')?.scrollIntoView({ behavior: 'smooth' })}>Shop phones</Button>
            <Button appearance="secondary" icon={<WrenchScrewdriverRegular />} onClick={() => navigate('/services')}>Book a repair</Button>
          </div>
          <div className="hero-assurance">
            <span><CheckmarkCircleRegular /> Verified devices</span>
            <span><CheckmarkCircleRegular /> Personal support</span>
            <span><CheckmarkCircleRegular /> Flexible pickup</span>
          </div>
        </Card>
        <div className="hero-product-shot" role="img" aria-label="SWARUPANANDA ELECTRONICS team at the Satmail showroom">
          <img src={`${import.meta.env.BASE_URL}shop-team-background.jpeg`} alt="" />
          <div className="hero-product-label"><span>Our showroom</span><strong>Satmail · Contai</strong></div>
        </div>
      </section>

      <section className="vivo-campaign" aria-labelledby="vivo-campaign-title">
        <div className="vivo-campaign-copy">
          <span className="vivo-campaign-eyebrow">SWARUPANANDA ELECTRONICS · EXCLUSIVE MOBILE · TV · FRIDGE · AC SHOWROOM</span>
          <Badge appearance="filled" color="danger" className="vivo-prebook-badge">Pre-booking started · প্রি-বুকিং শুরু</Badge>
          <Title3 id="vivo-campaign-title">Meet the Vivo X500 Series</Title3>
          <Body1>ZEISS co-engineered camera, 2K AMOLED display, powerful performance, long-lasting battery and smart AI features.</Body1>
          <p className="vivo-campaign-bengali">লাইভ ডেমো চলছে আমাদের দোকানে। এখনই প্রি-বুক করুন এবং বিশেষ অফার সম্পর্কে জানুন।</p>
          <div className="vivo-feature-list" aria-label="Vivo X500 Series highlights">
            <span><CheckmarkCircleRegular /> ZEISS Camera System</span>
            <span><CheckmarkCircleRegular /> Powerful performance</span>
            <span><CheckmarkCircleRegular /> 2K AMOLED display</span>
            <span><CheckmarkCircleRegular /> Long-lasting battery</span>
            <span><CheckmarkCircleRegular /> Smart AI features</span>
          </div>
          <div className="vivo-campaign-location"><LocationRegular /><span><strong>Visit us for a live demo</strong><small>{STORE_ADDRESS}</small><small>Owner: NIRMAL SAHOO</small></span></div>
          <div className="vivo-campaign-actions">
            <Button appearance="primary" icon={<ArrowRightRegular />} as="a" href={vivoPrebookUrl} target="_blank" rel="noreferrer">Ask about pre-booking</Button>
            <Button appearance="secondary" onClick={() => { setSelectedBrand('Vivo'); document.getElementById('phones')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore Vivo phones</Button>
            <Button appearance="subtle" as="a" href={`https://wa.me/919876543210?text=${encodeURIComponent('Hi, please share details about TVs, refrigerators and air conditioners available at your showroom.')}`} target="_blank" rel="noreferrer">Ask about TV, fridge &amp; AC</Button>
          </div>
          <small className="vivo-offer-note">Pre-booking offer details available in-store. Product availability and final specifications are subject to confirmation.</small>
        </div>
        <a className="vivo-campaign-poster" href={vivoPrebookUrl} target="_blank" rel="noreferrer" aria-label="Ask on WhatsApp about Vivo X500 Series pre-booking">
          <img src={`${import.meta.env.BASE_URL}vivo-x500-prebooking.jpeg`} alt="Vivo X500 Series pre-booking poster with ZEISS camera, 2K AMOLED, long-lasting battery, AI features, live demo and Contai showroom location" loading="lazy" />
          <span className="vivo-poster-cta">Pre-booking now open · Ask for the offer</span>
        </a>
      </section>

      <section className="trust-row" aria-label="Shopping benefits">
        <div><CheckmarkCircleRegular /><span><strong>Genuine devices</strong><small>Warranty included</small></span></div>
        <div><CartRegular /><span><strong>Fast fulfilment</strong><small>Delivery or local pickup</small></span></div>
        <div><WrenchScrewdriverRegular /><span><strong>Care after purchase</strong><small>Repairs &amp; trade-ins</small></span></div>
      </section>

      <section className="catalog-section" id="phones">
        <div className="section-heading">
          <div>
            <span className="section-kicker">CURATED FOR YOU</span>
            <Title3>Featured phones</Title3>
            <Body1>Thoughtfully picked, with every detail up front.</Body1>
          </div>
          <Field className="search-field" label="Search phones">
            <Input contentBefore={<SearchRegular />} value={search} onChange={(_, data) => setSearch(data.value)} placeholder="Search by model or brand" />
          </Field>
        </div>

        <TabList
          className="brand-filters"
          selectedValue={selectedBrand}
          onTabSelect={(_, data) => setSelectedBrand(String(data.value))}
          aria-label="Filter by brand"
        >
          {brands.map((brand) => <Tab key={brand} value={brand}>{brand}</Tab>)}
        </TabList>

        {notice && <p className="inline-notice" role="status">{notice}</p>}
        <StateView
          loading={loading}
          error={error}
          empty={visibleProducts.length === 0}
          onRetry={retry}
          onEmptyAction={() => { setSearch(''); setSelectedBrand('All'); }}
          emptyActionLabel="View all phones"
          emptyTitle="No phones match that search"
          emptyDescription="Try a different brand or clear your search to see the full collection."
        >
          <div className="product-grid">
            {visibleProducts.map((product) => <ProductTile key={product.id} product={product} onAdd={(item) => void addProduct(item)} onView3D={setPreviewProduct} />)}
          </div>
        </StateView>
      </section>
      {previewProduct && <Phone3DDialog key={previewProduct.id} product={previewProduct} onClose={() => setPreviewProduct(null)} />}
    </div>
  );
}
