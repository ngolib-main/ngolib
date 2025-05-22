import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Signup from '../Signup';

global.fetch = jest.fn();
global.alert = jest.fn();

// Mock Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

describe('<Signup />', () => {
    beforeEach(() => {
        fetch.mockClear();
        alert.mockClear();
    });

    it('renders header and default form fields', () => {
        render(<Signup />);
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.getByPlaceholderText('User name (optional)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Repeat password')).toBeInTheDocument();
        // NGO fields hidden
        expect(screen.queryByPlaceholderText('NGO Name (optional)')).not.toBeInTheDocument();
    });

    it('shows NGO fields when toggled on', async () => {
        render(<Signup />);
        const toggle = screen.getByRole('checkbox');
        await userEvent.click(toggle);
        expect(toggle).toBeChecked();
        expect(screen.getByPlaceholderText('NGO Name (optional)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('NGO Email (optional)')).toBeInTheDocument();
    });

    it('updates all input fields correctly', async () => {
        render(<Signup />);
        await userEvent.type(screen.getByPlaceholderText('User name (optional)'), 'user1');
        await userEvent.type(screen.getByPlaceholderText('Email'), 'a@b.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass1');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pass1');
        expect(screen.getByPlaceholderText('User name (optional)')).toHaveValue('user1');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('a@b.com');
        expect(screen.getByPlaceholderText('Password')).toHaveValue('pass1');
        expect(screen.getByPlaceholderText('Repeat password')).toHaveValue('pass1');
    });

    it('displays success message on successful signup', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Signup done' }) });
        render(<Signup />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'a@b.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pass1');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pass1');
        await userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
        expect(await screen.findByText(/✅ Success:/)).toBeInTheDocument();
    });

    it('displays error message on server error', async () => {
        fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Bad' }) });
        render(<Signup />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'x@x.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pw');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pw');
        await userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
        expect(await screen.findByText(/❌ Error:/)).toBeInTheDocument();
    });

    it('alerts and shows error message on network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Fail'));
        render(<Signup />);
        await userEvent.type(screen.getByPlaceholderText('Email'), 'y@z.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'pw2');
        await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'pw2');
        await userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
        expect(await screen.findByText(/❌ Error:/)).toBeInTheDocument();
        expect(alert).toHaveBeenCalledWith('Error: Fail');
    });
});
