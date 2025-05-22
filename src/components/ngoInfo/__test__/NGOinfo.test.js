import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NGOinfoPage from '../NGOinfo';

// Mock react-router hooks
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useParams: jest.fn(),
        useNavigate: () => mockNavigate,
    };
});

import { useParams, useNavigate } from 'react-router-dom';

// Mock Header and Footer
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);
jest.mock('../../reusable/Footer', () => () => <div data-testid="footer-mock" />);

global.fetch = jest.fn();

const mockNavigate = jest.fn();

describe('<NGOinfoPage />', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockNavigate.mockClear();
    });

    it('shows loading state initially', () => {
        useParams.mockReturnValue({ id: '5' });
        render(<NGOinfoPage />);
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(screen.getByText(/Loading NGO details.../i)).toBeInTheDocument();
        expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
    });

    it('renders error message and back button on fetch error', async () => {
        useParams.mockReturnValue({ id: '5' });
        fetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) });

        render(<NGOinfoPage />);
        await waitFor(() => screen.getByText(/Error Loading NGO/i));
        expect(screen.getByText('Error Loading NGO')).toBeInTheDocument();
        expect(screen.getByText('Not found')).toBeInTheDocument();

        const backBtn = screen.getByRole('button', { name: /Back to Search/i });
        await userEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders invalid ID format immediately', async () => {
        useParams.mockReturnValue({ id: 'abc' });
        render(<NGOinfoPage />);
        await waitFor(() => screen.getByText(/Error Loading NGO/i));
        expect(screen.getByText(/Invalid NGO ID format/i)).toBeInTheDocument();
        const btn = screen.getByRole('button', { name: /← Back to Search|← Return to Search/i });
        await userEvent.click(btn);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders NGO data when fetch is successful', async () => {
        const mockData = {
            ngo_id: 5,
            name: 'Test NGO',
            verified: true,
            tags: ['Env', 'Health'],
            description: 'Desc here',
            contact_email: 'test@ngo.org',
            phone_nr: '123456',
            website_url: 'https://ngo.org',
            followers: [1, 2],
            image: null
        };
        useParams.mockReturnValue({ id: '5' });
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) });

        render(<NGOinfoPage />);
        await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /Test NGO/i })).toBeInTheDocument());

        // Verified badge
        expect(screen.getByText(/Verified/i)).toBeInTheDocument();
        // Tags
        mockData.tags.forEach(tag => expect(screen.getByText(tag)).toBeInTheDocument());
        // Description
        expect(screen.getByText(mockData.description)).toBeInTheDocument();
        // Contact info
        expect(screen.getByRole('link', { name: mockData.contact_email })).toHaveAttribute('href', `mailto:${mockData.contact_email}`);
        expect(screen.getByText(mockData.phone_nr)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: mockData.website_url })).toHaveAttribute('href', mockData.website_url);

        // Donate button
        const donateBtn = screen.getByRole('button', { name: /Donate/i });
        await userEvent.click(donateBtn);
        expect(mockNavigate).toHaveBeenCalledWith(`/payment/5`);
    });
});
