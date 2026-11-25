import { useState } from 'react';
import {
  Badge,
  Body1,
  Button,
  Card,
  Field,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title1,
  Title3,
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowClockwiseRegular,
  BoxRegular,
  DocumentRegular,
  WrenchScrewdriverRegular,
} from '@fluentui/react-icons';
import { api } from '../api';
import type { Product, ProductInput } from '../api/types';
import { StateView } from '../components/StateView';
import { useApiData } from '../hooks/useApiData';

const emptyDraft: ProductInput = {
  brand: 'Nothing',
  model: 'Phone (2)',
  ram: '12 GB',
  storage: '256 GB',
  battery: '4700 mAh',
  price: 33999,
};

const inr = (amount: number) => `Rs ${amount.toLocaleString('en-IN')}`;

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  section.scrollIntoView?.({ behavior, block: 'start' });
}

export function AdminPage() {
  const { data: products, loading: productsLoading, error: productsError, retry: retryProducts } = useApiData(() => api.listProducts());
  const { data: leads, loading: leadsLoading, error: leadsError, retry: retryLeads } = useApiData(() => api.listServiceLeads());
  const [draft, setDraft] = useState<ProductInput>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setDraftField = (field: keyof ProductInput, value: string | number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setMessage(null);
    try {
      const image = imageFile ? await api.uploadProductImage(imageFile) : undefined;
      const created: Product = await api.addProduct({ ...draft, image });
      setMessage(`${created.brand} ${created.model} added to the catalog.`);
      retryProducts();
    } catch (reason: unknown) {
      setFormError(reason instanceof Error ? reason.message : 'We could not save this product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack admin-page">
      <div className="page-title-row">
        <div><span className="section-kicker">STORE OPERATIONS</span><Title1>Product &amp; service operations</Title1></div>
        <Button appearance="primary" icon={<AddRegular />} onClick={() => document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' })}>Add product</Button>
      </div>
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin sections">
          <div className="admin-side-active"><BoxRegular />Overview</div>
          <button type="button" aria-controls="catalog" onClick={() => scrollToSection('catalog')}><BoxRegular />Products</button>
          <button type="button" aria-controls="service-leads" onClick={() => scrollToSection('service-leads')}><WrenchScrewdriverRegular />Service leads</button>
        </aside>
        <div className="admin-content">
          <div className="admin-summary-grid">
            <Card className="admin-summary-card"><BoxRegular /><span>Catalog products</span><strong>{products?.length ?? '—'}</strong></Card>
            <Card className="admin-summary-card"><WrenchScrewdriverRegular /><span>Service leads</span><strong>{leads?.length ?? '—'}</strong></Card>
            <Card className="admin-summary-card"><DocumentRegular /><span>Open requests</span><strong>{leads?.filter((lead) => lead.status === 'Open').length ?? '—'}</strong></Card>
          </div>
          <section className="admin-panel" id="catalog">
            <div className="panel-title"><BoxRegular /><Title3>Product catalog</Title3><Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={retryProducts}>Refresh catalog</Button></div>
            <StateView
              loading={productsLoading}
              error={productsError}
              empty={(products ?? []).length === 0}
              onRetry={retryProducts}
              onEmptyAction={() => document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' })}
              emptyActionLabel="Add the first product"
              emptyTitle="Your catalog is empty"
              emptyDescription="Add a product to get your store ready for customers."
            >
              <div className="table-scroll">
                <Table aria-label="Product catalog" className="admin-table">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Product</TableHeaderCell>
                      <TableHeaderCell>RAM / storage</TableHeaderCell>
                      <TableHeaderCell>Battery</TableHeaderCell>
                      <TableHeaderCell>Price</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(products ?? []).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell><div className="table-product"><img src={product.image} alt="" /><span><strong>{product.brand} {product.model}</strong><small>{product.brand}</small></span></div></TableCell>
                        <TableCell>{product.ram} / {product.storage}</TableCell>
                        <TableCell>{product.battery}</TableCell>
                        <TableCell><strong>{inr(product.price)}</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="admin-product-list" role="list" aria-label="Mobile product catalog">
                {(products ?? []).map((product) => (
                  <div className="admin-product-row" role="listitem" key={product.id}>
                    <img src={product.image} alt="" />
                    <span className="admin-product-row-details">
                      <strong>{product.brand} {product.model}</strong>
                      <small>{product.ram} RAM · {product.storage}</small>
                      <small>{product.battery}</small>
                    </span>
                    <strong className="admin-product-row-price">{inr(product.price)}</strong>
                  </div>
                ))}
              </div>
            </StateView>
          </section>

          <section className="admin-panel" id="service-leads">
            <div className="panel-title"><WrenchScrewdriverRegular /><Title3>Service leads</Title3><Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={retryLeads}>Refresh leads</Button></div>
            <StateView
              loading={leadsLoading}
              error={leadsError}
              empty={(leads ?? []).length === 0}
              onRetry={retryLeads}
              emptyTitle="No service leads yet"
              emptyDescription="New repair and trade-in requests will show up here."
            >
              <div className="lead-list">
                {(leads ?? []).map((lead) => (
                  <Card className="lead-row" key={lead.id}>
                    <span className="lead-avatar">{lead.name.split(' ').map((part) => part[0]).join('')}</span>
                    <div className="lead-main"><strong>{lead.name}</strong><Body1>{lead.type} · {lead.device}</Body1></div>
                    <Badge appearance="tint" color={lead.status === 'Open' ? 'warning' : 'success'}>{lead.status}</Badge>
                  </Card>
                ))}
              </div>
            </StateView>
          </section>

          <Card className="admin-panel product-draft-panel" id="product-form">
            <div className="panel-title"><AddRegular /><Title3>Add a product</Title3></div>
            <Body1>Enter the product details shown in the storefront.</Body1>
            {message && <p className="success-message" role="status">{message}</p>}
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <form className="admin-product-form" onSubmit={(event) => void saveProduct(event)}>
              <Field label="Brand" required><Input value={draft.brand} onChange={(_, data) => setDraftField('brand', data.value)} /></Field>
              <Field label="Model" required><Input value={draft.model} onChange={(_, data) => setDraftField('model', data.value)} /></Field>
              <Field label="RAM" required><Input value={draft.ram} onChange={(_, data) => setDraftField('ram', data.value)} /></Field>
              <Field label="Storage" required><Input value={draft.storage} onChange={(_, data) => setDraftField('storage', data.value)} /></Field>
              <Field label="Battery" required><Input value={draft.battery} onChange={(_, data) => setDraftField('battery', data.value)} /></Field>
              <Field label="Price (INR)" required><Input type="number" min={1} value={String(draft.price)} onChange={(_, data) => setDraftField('price', Number(data.value))} /></Field>
              <Field label="Product image">
                <input
                  className="file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    if (selected && !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
                      setFormError('Choose a JPEG, PNG, or WebP product image.');
                      setImageFile(null);
                    } else if (selected && selected.size > 10 * 1024 * 1024) {
                      setFormError('Product images must be 10 MB or smaller.');
                      setImageFile(null);
                    } else {
                      setFormError(null);
                      setImageFile(selected);
                    }
                  }}
                />
              </Field>
              <Button type="submit" appearance="primary" icon={<AddRegular />} disabled={saving}>{saving ? 'Saving product…' : 'Add product to catalog'}</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
