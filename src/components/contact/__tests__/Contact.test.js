import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from '../Contact';
import { MemoryRouter } from 'react-router-dom';

// Mock the Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

// Mock fetch globally
global.fetch = jest.fn();
global.console.error = jest.fn();
global.console.log = jest.fn();

describe('<Contact />', () => {
    beforeEach(() => {
        // Clear mocks before each test
        fetch.mockClear();
        console.error.mockClear();
        console.log.mockClear();
    });

    const renderContact = () => render(
        <Contact />,
        { wrapper: MemoryRouter }
    );

    it('renders the contact page with header', () => {
        renderContact();

        // Check for header
        expect(screen.getByTestId('header-mock')).toBeInTheDocument();

        // Check for main elements
        expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
        expect(screen.getByText(/who do you want to contact?/i)).toBeInTheDocument();
        expect(screen.getByText(/what is the issue about?/i)).toBeInTheDocument();
        expect(screen.getByText(/message:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('has the correct default form values', () => {
        renderContact();

        // Check default values in form fields
        expect(screen.getByLabelText(/who do you want to contact?/i)).toHaveValue('Admin');
        expect(screen.getByLabelText(/what is the issue about?/i)).toHaveValue('General Question');
        expect(screen.getByLabelText(/message:/i)).toHaveValue('');
    });

    it('updates form values when user makes selections', async () => {
        renderContact();

        // Change recipient
        const recipientSelect = screen.getByLabelText(/who do you want to contact?/i);
        await userEvent.selectOptions(recipientSelect, 'Authorities');
        expect(recipientSelect).toHaveValue('Authorities');

        // Change issue
        const issueSelect = screen.getByLabelText(/what is the issue about?/i);
        await userEvent.selectOptions(issueSelect, 'Technical Issue');
        expect(issueSelect).toHaveValue('Technical Issue');

        // Add a message
        const messageInput = screen.getByLabelText(/message:/i);
        await userEvent.type(messageInput, 'This is a test message');
        expect(messageInput).toHaveValue('This is a test message');
    });

    it('submits the form with correct data', async () => {
        fetch.mockResolvedValueOnce({ ok: true });
        renderContact();

        // Fill out the form
        await userEvent.selectOptions(
            screen.getByLabelText(/who do you want to contact?/i),
            'Authorities'
        );

        await userEvent.selectOptions(
            screen.getByLabelText(/what is the issue about?/i),
            'Donation Inquiry'
        );

        await userEvent.type(
            screen.getByLabelText(/message:/i),
            'Test message for donation inquiry'
        );

        // Submit the form
        await userEvent.click(screen.getByRole('button', { name: /send message/i }));

        // Check if fetch was called with correct data
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/contact/form',
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        to: 'Authorities',
                        subject: 'Donation Inquiry',
                        message: 'Test message for donation inquiry',
                    })
                }
            );
        });

        // Check console.log was called with form data
        expect(console.log).toHaveBeenCalledWith(
            'Submitted Contact Request:',
            {
                recipient: 'Authorities',
                issue: 'Donation Inquiry',
                message: 'Test message for donation inquiry',
            }
        );
    });

    it('handles form submission error gracefully', async () => {
        // Mock fetch to reject with an error
        fetch.mockRejectedValueOnce(new Error('Network error'));
        renderContact();

        // Fill the required message field
        await userEvent.type(
            screen.getByLabelText(/message:/i),
            'Test message'
        );

        // Submit the form
        await userEvent.click(screen.getByRole('button', { name: /send message/i }));

        // Check if error was logged
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                'Error logging admin action:',
                expect.any(Error)
            );
        });
    });

    it('prevents submission when required message field is empty', async () => {
        renderContact();

        // Try to submit without filling the required message field
        await userEvent.click(screen.getByRole('button', { name: /send message/i }));

        // Form should not be submitted, fetch should not be called
        expect(fetch).not.toHaveBeenCalled();
    });
});