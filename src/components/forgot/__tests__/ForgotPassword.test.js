import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../ForgotPassword';


// Mock Header component
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

describe('<ForgotPassword />', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('renders form elements and header', () => {
        render(<ForgotPassword />);
        // Header
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        // Email input
        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        expect(emailInput).toBeInTheDocument();
        // Submit button
        const submitButton = screen.getByRole('button', { name: /send recovery email/i });
        expect(submitButton).toBeInTheDocument();
        // Login link
        const loginLink = screen.getByRole('link', { name: /log in/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('submits email and shows success message on OK response', async () => {
        const mockEmail = 'user@example.com';
        const mockResponse = {};
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        render(<ForgotPassword />);

        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        await userEvent.type(emailInput, mockEmail);

        const submitButton = screen.getByRole('button', { name: /send recovery email/i });
        await userEvent.click(submitButton);

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/auth/forgot-password',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: mockEmail })
            })
        );

        await waitFor(() => expect(screen.getByText(/recovery instructions sent to your email\./i)).toBeInTheDocument());
    });

    it('shows error message from response on failure', async () => {
        const mockEmail = 'fail@example.com';
        const mockError = { message: 'User not found' };
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve(mockError)
        });

        render(<ForgotPassword />);
        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        await userEvent.type(emailInput, mockEmail);
        const submitButton = screen.getByRole('button', { name: /send recovery email/i });
        await userEvent.click(submitButton);

        await waitFor(() => expect(screen.getByText(/user not found/i)).toBeInTheDocument());
    });

    it('shows generic error message when response has no message', async () => {
        const mockEmail = 'genericfail@example.com';
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({})
        });

        render(<ForgotPassword />);
        const emailInput = screen.getByPlaceholderText(/enter your email/i);
        await userEvent.type(emailInput, mockEmail);
        const submitButton = screen.getByRole('button', { name: /send recovery email/i });
        await userEvent.click(submitButton);

        await waitFor(() => expect(screen.getByText(/something went wrong\./i)).toBeInTheDocument());
    });
});
