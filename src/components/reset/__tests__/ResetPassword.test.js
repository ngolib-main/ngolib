import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../ResetPassword';

const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => mockUseSearchParams(),
    };
});

// Mock Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

global.fetch = jest.fn();
global.alert = jest.fn();

describe('<ResetPassword />', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockNavigate.mockClear();
        mockUseSearchParams.mockClear();
        alert.mockClear();
    });

    it('renders loading and then populates email on valid token', async () => {
        // Simulate token present
        mockUseSearchParams.mockReturnValue([{ get: (key) => 'abc123' }]);
        // First fetch: validate token
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user_id: 42, email: 'user@example.com' }) });

        render(<ResetPassword />);
        expect(screen.getByText(/Reset account password/i)).toBeInTheDocument();
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            '/api/auth/find-user',
            expect.objectContaining({ method: 'POST' })
        ));
        // Email input populated
        await waitFor(() => expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com'));
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    });


    it('shows error and redirects on invalid token', async () => {
        mockUseSearchParams.mockReturnValue([{ get: () => 'badtoken' }]);
        // Token validation fails
        fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Invalid token' }) });

        render(<ResetPassword />);
        await waitFor(() => expect(alert).toHaveBeenCalledWith(
            'Invalid or expired token \nYou will be redirected to the Forgot Password page.'
        ));
        expect(mockNavigate).toHaveBeenCalledWith('/forgot');
    });

    it('submits new password successfully', async () => {
        mockUseSearchParams.mockReturnValue([{ get: () => 'validtoken' }]);
        // Validate token
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user_id: 7, email: 'a@b.com' }) });

        render(<ResetPassword />);
        await waitFor(() => screen.getByPlaceholderText('Email'));

        // Mock reset-password response
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Password updated' }) });

        // Fill password fields
        await userEvent.type(screen.getByPlaceholderText('Password'), 'newpass');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'newpass');
        await userEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        expect(await screen.findByText(/✅ Success:/i)).toBeInTheDocument();
    });

    it('shows error message on reset failure', async () => {
        mockUseSearchParams.mockReturnValue([{ get: () => 'validtoken' }]);
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user_id: 7, email: 'x@y.com' }) });
        render(<ResetPassword />);
        await waitFor(() => screen.getByPlaceholderText('Email'));

        fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Mismatch' }) });
        await userEvent.type(screen.getByPlaceholderText('Password'), 'p1');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'p2');
        await userEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        expect(await screen.findByText(/❌ Error:/i)).toBeInTheDocument();
    });

    it('handles network error on reset', async () => {
        mockUseSearchParams.mockReturnValue([{ get: () => 'validtoken' }]);
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user_id: 5, email: 'e@f.com' }) });
        render(<ResetPassword />);
        await waitFor(() => screen.getByPlaceholderText('Email'));

        fetch.mockRejectedValueOnce(new Error('Network'));
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pw');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pw');
        await userEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        expect(await screen.findByText(/❌ Error:/i)).toBeInTheDocument();
        expect(alert).toHaveBeenCalledWith('Error: Network');
    });
});