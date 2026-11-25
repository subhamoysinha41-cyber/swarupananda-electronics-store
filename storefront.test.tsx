import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

describe('MobileStore storefront', () => {
  it('shows the Vivo X500 pre-booking campaign from the supplied showroom poster', async () => {
    render(<App />);

    expect(await screen.findByRole('region', { name: 'Meet the Vivo X500 Series' })).toBeInTheDocument();
    expect(screen.getByText(/ZEISS co-engineered camera, 2K AMOLED display/)).toBeInTheDocument();
    expect(screen.getByText(/EXCLUSIVE MOBILE · TV · FRIDGE · AC SHOWROOM/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Meet the Vivo X500 Series' })).getByText('Satmail, Contai, Purba Medinipur, PIN 721452')).toBeInTheDocument();
    expect(screen.getAllByText('Satmail, Contai, Purba Medinipur, PIN 721452')).toHaveLength(2);
    expect(document.querySelector('.hero-product-shot img')).toHaveAttribute('src', '/shop-team-background.jpeg');
    expect(screen.getByRole('img', { name: /Vivo X500 Series pre-booking poster/ })).toHaveAttribute('src', '/vivo-x500-prebooking.jpeg');
    expect(screen.getByRole('link', { name: 'Ask about pre-booking' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('shows the planned phones and adds one to the cart', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Samsung Galaxy S24 5G')).toBeInTheDocument();
    expect(screen.getByText('Rs 61,999')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Add to cart' })[0]);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('added to your cart');
    });
  });

  it('filters the catalog to Vivo and Oppo phones', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Vivo' }));
    expect(await screen.findByText('Vivo X200 Pro')).toBeInTheDocument();
    expect(screen.getByText('Vivo T4')).toBeInTheDocument();
    expect(screen.queryByText('Oppo Find X8')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Oppo' }));
    expect(await screen.findByText('Oppo Find X8')).toBeInTheDocument();
    expect(screen.getByText('Oppo K13 5G')).toBeInTheDocument();
    expect(screen.queryByText('Vivo X200 Pro')).not.toBeInTheDocument();
  });

  it('offers an interactive 3D-style viewer for every phone', async () => {
    const user = userEvent.setup();
    render(<App />);

    const viewButtons = await screen.findAllByRole('button', { name: /View .+ in 3D/ });
    expect(viewButtons).toHaveLength(22);
    await user.click(viewButtons[0]);

    const dialog = await screen.findByRole('dialog', { name: 'View Samsung Galaxy S24 5G in 3D' });
    expect(dialog).toHaveTextContent('Front view');
    expect(dialog).toHaveTextContent('Illustrative 3D-style model');
    fireEvent.change(within(dialog).getByRole('slider', { name: 'Rotate phone' }), { target: { value: '180' } });
    expect(dialog).toHaveTextContent('Back view');
    expect(dialog.querySelector('.phone-model')).toHaveStyle({ transform: 'rotateX(-5deg) rotateY(180deg)' });
  });

  it('navigates admin sections without jumping the page hash', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');
    render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Admin' }));
    await user.click(await screen.findByRole('button', { name: 'Products' }));

    expect(window.location.hash).toBe('');
    expect(screen.getByText('Product catalog')).toBeInTheDocument();
  });

  it('provides a mobile-friendly product catalog alongside the desktop table', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');
    render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Admin' }));

    expect(await screen.findByRole('table', { name: 'Product catalog' })).toBeInTheDocument();
    expect(within(await screen.findByRole('list', { name: 'Mobile product catalog' })).getAllByRole('listitem')).toHaveLength(22);
  });

  it('switches cleanly between light and dark themes', async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(<App />);

    const darkModeButton = await screen.findByRole('button', { name: 'Switch to dark mode' });
    await user.click(darkModeButton);
    expect(document.documentElement).toHaveClass('theme-dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('theme-dark');
  });
});
