import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Donate from '../Donate';
import { MemoryRouter } from 'react-router-dom';

// Mock useParams to supply ngo_id
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '7' }),
    };
});

// Mock Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

global.fetch = jest.fn();
global.alert = jest.fn();

describe('<Donate />', () => {
    beforeEach(() => {
        fetch.mockClear();
        alert.mockClear();
    });

    const renderDonate = () => render(<Donate />, { wrapper: MemoryRouter });

    it('renders header and form with default values', () => {
        renderDonate();
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Payment/i })).toBeInTheDocument();

        const cardInput = screen.getByLabelText(/Card Number:/i);
        const expiryInput = screen.getByLabelText(/Card Expiration:/i);
        const cvvInput = screen.getByLabelText(/Security Code:/i);
        const amountInput = screen.getByLabelText(/Amount, €/i);

        expect(cardInput).toHaveValue('');
        expect(expiryInput).toHaveValue('');
        expect(cvvInput).toHaveValue('');
        expect(amountInput).toHaveValue(50);
        expect(screen.queryByText(/Please fill all fields correctly/i)).not.toBeInTheDocument();
    });

    it('shows validation error when fields are invalid', async () => {
        renderDonate();
        await userEvent.click(screen.getByRole('button', { name: /Proceed/i }));
        expect(await screen.findByText(/Please fill all fields correctly/i)).toBeInTheDocument();
    });

    it('formats card number into groups of four digits', async () => {
        renderDonate();
        const cardInput = screen.getByLabelText(/Card Number:/i);
        await userEvent.type(cardInput, '1234567890123456');
        expect(cardInput).toHaveValue('1234 5678 9012 3456');
    });

    it('formats expiration input with slash', async () => {
        renderDonate();
        const expiryInput = screen.getByLabelText(/Card Expiration:/i);
        await userEvent.type(expiryInput, '1225');
        expect(expiryInput).toHaveValue('12/25');
    });

    it('submits payment successfully and shows success status', async () => {
        // Mock successful payment response
        fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

        renderDonate();
        // Fill valid inputs
        await userEvent.type(screen.getByLabelText(/Card Number:/i), '4111111111111111');
        await userEvent.type(screen.getByLabelText(/Card Expiration:/i), '12/30');
        await userEvent.type(screen.getByLabelText(/Security Code:/i), '123');
        await userEvent.clear(screen.getByLabelText(/Amount, €/i));
        await userEvent.type(screen.getByLabelText(/Amount, €/i), '10');

        await userEvent.click(screen.getByRole('button', { name: /Proceed/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/payment',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ ngo_id: 7, amount: 10 }),
                })
            );
        });
        expect(await screen.findByText(/Donation successfully sent/i)).toBeInTheDocument();
    });

    it('shows login error on non-OK response', async () => {
        fetch.mockResolvedValueOnce({ ok: false, text: () => Promise.resolve('error') });

        renderDonate();
        // valid fields
        await userEvent.type(screen.getByLabelText(/Card Number:/i), '4111111111111111');
        await userEvent.type(screen.getByLabelText(/Card Expiration:/i), '12/30');
        await userEvent.type(screen.getByLabelText(/Security Code:/i), '123');
        await userEvent.clear(screen.getByLabelText(/Amount, €/i));
        await userEvent.type(screen.getByLabelText(/Amount, €/i), '5');

        await userEvent.click(screen.getByRole('button', { name: /Proceed/i }));

        expect(await screen.findByText(/Something went wrong, make sure you are logged in/i)).toBeInTheDocument();
    });

    it('shows network error message on fetch throw', async () => {
        fetch.mockRejectedValueOnce(new Error('Network fail'));

        renderDonate();
        // valid fields
        await userEvent.type(screen.getByLabelText(/Card Number:/i), '4111111111111111');
        await userEvent.type(screen.getByLabelText(/Card Expiration:/i), '12/30');
        await userEvent.type(screen.getByLabelText(/Security Code:/i), '123');
        await userEvent.clear(screen.getByLabelText(/Amount, €/i));
        await userEvent.type(screen.getByLabelText(/Amount, €/i), '20');

        await userEvent.click(screen.getByRole('button', { name: /Proceed/i }));
        expect(await screen.findByText(/Something went wrong, try again later/i)).toBeInTheDocument();
    });
});
