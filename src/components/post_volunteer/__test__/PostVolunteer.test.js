import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostVolunteer from '../PostVolunteer';
import { MemoryRouter } from 'react-router-dom';

// Mock components and hooks
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock globals
global.fetch = jest.fn();
const localStorageMock = {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe('<PostVolunteer />', () => {
    const mockContactData = [{
        contact_email: 'ngo@example.com',
        phone_nr: '123-456-7890',
        ngo_id: 1
    }];

    const mockFormData = {
        title: 'Test Opportunity',
        description: 'Test Description',
        location: 'Test Location',
        start: '2025-01-01',
        end: '2025-01-05'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockContactData)
            })
        );
    });

    const renderComponent = async () => {
        const user = userEvent.setup();
        render(<PostVolunteer />, { wrapper: MemoryRouter });
        return user;
    };

    it('submits form and navigates on success', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockContactData) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'Success' }) });

        const user = await renderComponent();

        // Wait for form to load
        await waitFor(() => screen.getByLabelText(/Title/i));

        // Fill form
        await user.type(await screen.findByLabelText(/Title/i), mockFormData.title);
        await user.type(screen.getByLabelText(/Description/i), mockFormData.description);
        await user.type(screen.getByLabelText(/Location/i), mockFormData.location);
        await user.type(screen.getByLabelText(/Start Date/i), mockFormData.start);
        await user.type(screen.getByLabelText(/End Date/i), mockFormData.end);

        // Submit form
        await user.click(screen.getByRole('button', { name: /Post Opportunity/i }));

        await waitFor(() => {
            // First call is the contact fetch; second is the postOpportunity
            expect(global.fetch).toHaveBeenNthCalledWith(
                2,
                '/api/postOpportunity',
                expect.objectContaining({
                    method: 'POST',
                    credentials: 'include',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer null'
                    }),
                    body: JSON.stringify(mockFormData)
                })
            );

            // And navigation happens
            expect(mockNavigate).toHaveBeenCalledWith('/profile', expect.anything());
        });
    });


    it('shows error message when contact fetch fails', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'API Error' })
        });

        await renderComponent();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Error/i })).toBeInTheDocument();
            expect(screen.getByText(/API Error/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
        });
    });
});