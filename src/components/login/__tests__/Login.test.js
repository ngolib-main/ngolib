import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

// Global mocks
global.fetch = jest.fn();
global.alert = jest.fn();

describe('<Login />', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockNavigate.mockClear();
        alert.mockClear();
    });

    it('renders header and login form fields', () => {
        render(<Login />);
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    it('updates input values correctly', async () => {
        render(<Login />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'secret');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com');
        expect(screen.getByPlaceholderText('Password')).toHaveValue('secret');
    });

    it('submits and navigates on successful login', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Logged in' }) });
        render(<Login />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'secret');
        await userEvent.click(screen.getByRole('button', { name: /Log In/i }));
        expect(await screen.findByText(/✅ Success:/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('shows error message on server error without navigation', async () => {
        fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Invalid' }) });
        render(<Login />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: /Log In/i }));
        expect(await screen.findByText(/❌ Error:/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('alerts and shows error message on network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network fail'));
        render(<Login />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'user@example.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'secret');
        await userEvent.click(screen.getByRole('button', { name: /Log In/i }));
        expect(await screen.findByText(/❌ Error:/i)).toBeInTheDocument();
        expect(alert).toHaveBeenCalledWith('Error: Network fail');
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
