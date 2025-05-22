import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../Profile';
import { MemoryRouter } from 'react-router-dom';
import { displayedSectionsUser } from '../displaySections';
import styles from '../../style/page/profile.module.css';

jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

// Mock global fetch and alert
global.fetch = jest.fn();
global.alert = jest.fn();

describe('<Profile />', () => {
    const mockProfileData = {
        user: { type: 'user', username: 'User1', email: 'user1@example.com' },
        image: null,
        followings: [{ ngo_id: 1, ngo_name: 'Test NGO', status: 'active' }],
        subscriptions: [{ ngo_id: 2, ngo_name: 'Sub NGO', status: 'active' }],
        donations: [{ title: 'Donation1', amount: 100, status: 'active' }],
    };

    // Stub FileReader to immediately load a fake image
    beforeEach(() => {
        fetch.mockClear();
        alert.mockClear();

        global.FileReader = class {
            constructor() { this.onload = null; }
            readAsDataURL() { this.result = 'data:image/png;base64,fake'; this.onload(); }
        };
    });

    const renderProfile = () => render(<Profile />, { wrapper: MemoryRouter });

    it('renders Header and profile information after fetching', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });

        renderProfile();
        // Loading indicator shown initially
        expect(screen.getByText(/Loading profile data.../i)).toBeInTheDocument();

        // Wait for fetch and component update
        await waitFor(() => expect(screen.getByTestId('header-mock')).toBeInTheDocument());
        // GET should be called on the relative endpoint
        expect(fetch).toHaveBeenCalledWith('/api/profile', expect.any(Object));
        // User info appears
        expect(screen.getByRole('heading', { name: /User1/i })).toBeInTheDocument();
        expect(screen.getByText(/Email: user1@example.com/i)).toBeInTheDocument();
    });

    it('uploads profile picture and updates image src to client preview', async () => {
        // Mock GET profile
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        // Mock POST image upload
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image: 'data:image/png;base64,newfake' }) });

        renderProfile();
        await waitFor(() => screen.getByRole('heading', { name: /User1/i }));

        // Click the Add picture button and upload file
        const addButton = screen.getByRole('button', { name: /Add picture/i });
        await userEvent.click(addButton);

        const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
        const input = document.querySelector('input[type="file"]');
        await userEvent.upload(input, file);

        // Ensure POST is sent to relative image endpoint with client Base64
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/profile/image',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ imageBase64: 'data:image/png;base64,fake' }),
                })
            );
        });
        expect(alert).toHaveBeenCalledWith('Upload successful');
    });

    it('toggles accordion open and close via CSS class', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });

        renderProfile();
        await waitFor(() => screen.getByRole('heading', { name: /User1/i }));

        // Locate the first accordion title and its content container
        const titleText = displayedSectionsUser[0].title;
        const titleDiv = screen.getByText(titleText);
        const contentDiv = titleDiv.nextElementSibling;

        // Initially collapsed: no "open" CSS class
        expect(contentDiv.classList.contains(styles.open)).toBe(false);

        // Click to expand
        await userEvent.click(titleDiv);
        expect(contentDiv.classList.contains(styles.open)).toBe(true);
        // Content text appears
        expect(within(contentDiv).getByText('Test NGO')).toBeInTheDocument();

        // Click again to collapse
        await userEvent.click(titleDiv);
        expect(contentDiv.classList.contains(styles.open)).toBe(false);
    });

    it('handles unfollow action and removes item from list', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        // Mock DELETE unfollow
        fetch.mockResolvedValueOnce({ ok: true });

        renderProfile();
        await waitFor(() => screen.getByRole('heading', { name: /User1/i }));

        // Expand "Followings"
        const followTitle = screen.getByText(displayedSectionsUser[0].title);
        await userEvent.click(followTitle);

        // Click the Unfollow button
        const unfollowButton = screen.getByRole('button', { name: /Unfollow/i });
        await userEvent.click(unfollowButton);

        // Expect DELETE to relative unfollow endpoint
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/profile/unfollow',
                expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ ngoId: 1 }) })
            );
        });
        expect(alert).toHaveBeenCalledWith('You have unfollowed the NGO.');
        // After unfollow, the item is removed from the DOM
        expect(screen.queryByText('Test NGO')).not.toBeInTheDocument();
    });
});