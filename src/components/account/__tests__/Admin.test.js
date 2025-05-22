import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Admin from '../Admin';
import { MemoryRouter } from 'react-router-dom';
import { displayedSectionsAdmin } from '../../profile/displaySections';
import styles from '../../style/page/profile.module.css';

// Mock Header
jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock" />);

global.fetch = jest.fn();
global.alert = jest.fn();
window.confirm = jest.fn();

beforeEach(() => {
    fetch.mockClear();
    alert.mockClear();
    window.confirm.mockClear();
    // Stub FileReader
    global.FileReader = class {
        constructor() { this.onload = null; }
        readAsDataURL() { this.result = 'data:image/png;base64,fake'; this.onload(); }
    };
});

describe('<Admin />', () => {
    const mockProfileData = {
        user: { username: 'AdminUser', email: 'admin@example.com', adminId: 42 },
        image: null,
        allSubscriptions: [ { subscription_id: 1, ngo_id: 11, ngo_name: 'NGO One', status: 'active' } ],
        allDonations: [ { donation_id: 2, ngo_name: 'NGO Two', amount: 100, status: 'completed' } ],
        verifications: [ { verification_id: 3, ngo_id: 12, name: 'NGO Three', status: 'pending' } ],
        tags: [ [ { tag_id: 4, tag: 'Health' } ] ],
        actions: [ { action_id: 5, action_type: 'login', action_details: 'Logged in' } ],
    };

    const renderAdmin = () => render(<Admin />, { wrapper: MemoryRouter });

    it('renders Header and profile info after fetch', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });

        renderAdmin();
        expect(screen.getByText(/Loading profile data.../i)).toBeInTheDocument();

        await waitFor(() => expect(screen.getByTestId('header-mock')).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledWith('/api/profile', expect.any(Object));

        expect(screen.getByRole('heading', { name: /AdminUser/i })).toBeInTheDocument();
        expect(screen.getByText(/Email: admin@example.com/i)).toBeInTheDocument();
    });

    it('uploads profile picture and updates image src', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image: 'data:image/png;base64/newfake' }) });

        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));

        const addBtn = screen.getByRole('button', { name: /Add picture/i });
        await userEvent.click(addBtn);

        const file = new File(['data'], 'photo.png', { type: 'image/png' });
        const input = document.querySelector('input[type="file"]');
        await userEvent.upload(input, file);

        // check POST payload
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/profile/image',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ imageBase64: 'data:image/png;base64,fake' }),
                })
            );
        });
        expect(alert).toHaveBeenCalledWith('Upload successful');
        expect(screen.getByAltText(/Your image/i)).toHaveAttribute('src', 'data:image/png;base64,fake');
    });

    it('toggles accordion sections via CSS class', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));

        for (let idx = 0; idx < displayedSectionsAdmin.length; idx++) {
            const section = displayedSectionsAdmin[idx];
            const title = screen.getByText(section.title);
            const accSection = title.parentElement; // .accordionSection
            const content = within(accSection).getByRole('list').parentElement; // the div.accordionContent wrapping ul

            // initially closed
            expect(content).not.toHaveClass(styles.open);

            // open
            await userEvent.click(title);
            await waitFor(() => expect(content).toHaveClass(styles.open));

            // close
            await userEvent.click(title);
            await waitFor(() => expect(content).not.toHaveClass(styles.open));
        }
    });

    it('renders tag input container only when corresponding section is open', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));

        const filterHeadings = [
            'Subscriptions filters',
            'Donations filters',
            'Verifications filters',
            'Tags options'
        ];

        for (let idx = 0; idx < filterHeadings.length; idx++) {
            expect(screen.queryByText(filterHeadings[idx])).not.toBeInTheDocument();
            const sectionTitle = screen.getByText(displayedSectionsAdmin[idx].title);
            await userEvent.click(sectionTitle);
            expect(screen.getByText(filterHeadings[idx])).toBeInTheDocument();
            await userEvent.click(sectionTitle);
            expect(screen.queryByText(filterHeadings[idx])).not.toBeInTheDocument();
        }
    });

    it('allows adding a new tag', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ tag_id: 6 }) });

        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));

        // open Tags section (index 3)
        const tagSectionTitle = screen.getByText(displayedSectionsAdmin[3].title);
        await userEvent.click(tagSectionTitle);

        const input = screen.getByPlaceholderText(/Enter new tag/i);
        const addButton = screen.getByRole('button', { name: /Add Tag/i });

        expect(addButton).toBeDisabled();
        await userEvent.type(input, 'NewTag');
        expect(addButton).toBeEnabled();

        await userEvent.click(addButton);
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/tag',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ tag: 'NewTag' }),
            })
        );
        expect(alert).toHaveBeenCalledWith('Tag "NewTag" has been successfully added!');
        expect(input).toHaveValue('');
    });



    it('does not change subscription status when user cancels confirmation', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        window.confirm.mockReturnValueOnce(false);
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));
        const subsTitle = screen.getByText(displayedSectionsAdmin[0].title);
        await userEvent.click(subsTitle);
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        await userEvent.click(cancelBtn);
        expect(fetch).not.toHaveBeenCalledWith(
            '/api/admin/subscriptions/1/status',
            expect.any(Object)
        );
    });

    it('changes subscription status when user confirms', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        window.confirm.mockReturnValueOnce(true);
        fetch.mockResolvedValueOnce({ ok: true });
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));
        const subsTitle = screen.getByText(displayedSectionsAdmin[0].title);
        await userEvent.click(subsTitle);
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        await userEvent.click(cancelBtn);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/admin/subscriptions/1/status',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ status: 'canceled' }),
                })
            );
        });
        expect(screen.getByText('canceled')).toBeInTheDocument();
    });

    it('does not remove tag when user cancels confirmation', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        window.confirm.mockReturnValueOnce(false);
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));
        const tagTitle = screen.getByText(displayedSectionsAdmin[3].title);
        await userEvent.click(tagTitle);
        const removeBtn = screen.getByRole('button', { name: /Remove/i });
        await userEvent.click(removeBtn);
        expect(fetch).not.toHaveBeenCalledWith(
            '/api/admin/delete-tag',
            expect.any(Object)
        );
    });

    it('removes tag when user confirms', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        window.confirm.mockReturnValueOnce(true);
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));
        const tagTitle = screen.getByText(displayedSectionsAdmin[3].title);
        await userEvent.click(tagTitle);
        const removeBtn = screen.getByRole('button', { name: /Remove/i });
        await userEvent.click(removeBtn);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                '/api/admin/delete-tag',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ tag_id: 4 }),
                })
            );
        });
        expect(alert).toHaveBeenCalledWith('Tag has been successfully deleted!');
        expect(screen.queryByText('Health')).not.toBeInTheDocument();
    });


    it('updates input value and enables Add Label on subscriptions filter change', async () => {
        // Prepare profile data
        fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProfileData) });
        renderAdmin();
        await waitFor(() => screen.getByRole('heading', { name: /AdminUser/i }));

        // Open Subscriptions Filters section (index 0)
        const subsSection = screen.getByText(displayedSectionsAdmin[3].title);
        await userEvent.click(subsSection);

        const filterInput = screen.getByPlaceholderText(/Enter new tag/i);
        const addButton = screen.getByRole('button', { name: /Add Tag/i });

        // Initially input is empty and button disabled
        expect(filterInput).toHaveValue('');
        expect(addButton).toBeDisabled();

        // Type into input
        await userEvent.type(filterInput, 'MySubscriptionTag');
        expect(filterInput).toHaveValue('MySubscriptionTag');
        expect(addButton).toBeEnabled();
    });
});