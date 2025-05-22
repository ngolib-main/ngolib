import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SearchPage from '../Search';

// mock the cards with simple renders
const mockNGOCard = jest.fn(({ ngo }) => <div data-testid={`ngo-card-${ngo.ngo_id}`}>{ngo.name}</div>);
const mockOpportunityCard = jest.fn(({ opp, onOpenModal }) => (
    <button data-testid={`opportunity-card-${opp.opportunity_id}`} onClick={() => onOpenModal(opp)}>
        {opp.title}
    </button>
));         // data-testid is used in tests to find elements by their id for ease

jest.mock('../SearchCards', () => ({
    NGOCard: (props) => mockNGOCard(props),
    OpportunityCard: (props) => mockOpportunityCard(props),
}));

const mockNavigateFn = jest.fn();
jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom');
    return {
        __esModule: true,
        ...originalModule, // Spread in actual MemoryRouter, Routes, Route etc.
        useNavigate: () => mockNavigateFn,
    };
});

global.fetch = jest.fn();

const mockSessionStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };  // full mockup of storage object
})();
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true });

jest.mock('../../reusable/Header', () => () => <div data-testid="header-mock">Header</div>);

describe('SearchPage Component', () => {
    const mockNgos = [
        { ngo_id: 1, name: 'NGO Alpha', description: 'Alpha Desc', verified: true, tags: ['Environment', 'Local'] },
        { ngo_id: 2, name: 'NGO Beta', description: 'Beta Desc', verified: true, tags: ['Animals', 'Local'] },
        { ngo_id: 3, name: 'NGO Gamma (Unverified)', description: 'Gamma Desc', verified: false, tags: ['Health'] },
        { ngo_id: 4, name: 'NGO Delta', description: 'Delta Desc', verified: true, tags: ['Environment'] },
    ];
    const mockOpportunities = [
        { opportunity_id: 101, title: 'Beach Cleanup', description: 'Clean beach', location: 'Beach', tags: ['Environment', 'Coastal'], start: '2025-01-01', end: '2025-01-01', contact_email: 'a@b.com', contact_phone: '123' },
        { opportunity_id: 102, title: 'Tree Planting', description: 'Plant trees', location: 'Forest', tags: ['Environment', 'Forestry'], start: '2025-02-01', end: '2025-02-01', contact_email: 'c@d.com', contact_phone: '456'  },
    ];
    const mockGlobalTagsNgos = ['Environment', 'Local', 'Animals', 'Health'];
    const mockGlobalTagsOpps = ['Environment', 'Coastal', 'Forestry'];

    beforeEach(() => {
        fetch.mockClear();
        mockNavigateFn.mockClear();
        sessionStorage.clear();
        mockNGOCard.mockClear();
        mockOpportunityCard.mockClear();

        // initial NGO load
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ ngos: mockNgos, tags: mockGlobalTagsNgos }),
        });
    });

    // auto wrapping with <MemoryRouter>
    const renderWithRouter = (ui, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route);
        return render(ui, { wrapper: MemoryRouter });
    };

    it('renders Header, initial NGOs, and tags from API', async () => {
        renderWithRouter(<SearchPage />);

        await waitFor(() => {
            expect(screen.getByText('NGO Alpha')).toBeInTheDocument(); // wait for an ngo to load, otherwise page might still be in loading state
        });

        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith('/api/ngos');        // means useEffect called fetch with this route as argument

        await waitFor(() => {   // async to give time to load
            expect(screen.getByText('NGO Alpha')).toBeInTheDocument();
            expect(screen.getByText('NGO Beta')).toBeInTheDocument();
            expect(screen.queryByText('NGO Gamma (Unverified)')).not.toBeInTheDocument(); // should be filtered out
        });

        mockGlobalTagsNgos.forEach(tag => {
            expect(screen.getByText(tag, { selector: 'aside button, aside li' })).toBeInTheDocument(); // check for tags in sidebar
        });
    });

    it('switches to opportunities mode, fetches new data, and displays opportunities', async () => {
        renderWithRouter(<SearchPage />);
        await waitFor(() => expect(screen.getByText('NGO Alpha')).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledTimes(1);

        fetch.mockResolvedValueOnce({ // mock for opportunities mode
            ok: true,
            json: () => Promise.resolve({ opportunities: mockOpportunities, tags: mockGlobalTagsOpps }),
        });

        const modeSelect = screen.getByRole('combobox');
        await userEvent.selectOptions(modeSelect, 'opportunities');

        await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/opportunities'));
        expect(fetch).toHaveBeenCalledTimes(2);

        await waitFor(() => {
            expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
            expect(screen.getByText('Tree Planting')).toBeInTheDocument();
        });
        mockGlobalTagsOpps.forEach(tag => {
            expect(screen.getByText(tag, { selector: 'aside button, aside li' })).toBeInTheDocument();
        });
    });

    it('filters NGOs by selected tag', async () => {
        renderWithRouter(<SearchPage />);
        await waitFor(() => expect(screen.getByText('NGO Alpha')).toBeInTheDocument());

        const environmentTagButton = screen.getByText('Environment', { selector: 'aside button' });
        await userEvent.click(environmentTagButton);

        await waitFor(() => {
            expect(screen.getByText('NGO Alpha')).toBeInTheDocument();
            expect(screen.getByText('NGO Delta')).toBeInTheDocument();
            expect(screen.queryByText('NGO Beta')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Environment', { selector: 'aside li' })).toBeInTheDocument();  // selected tags
        expect(screen.getByRole('button', { name: /X/i, ancestor: screen.getByText('Environment', { selector: 'aside li' }).closest('li') })).toBeInTheDocument();  // locate the x button
    });     // selector narrows down the search, looks at environemnts within li thats within aside, closest travels up dom to the first ancestor matching, X is the text in the button,
            // ancestor tells getByRole to look for the button inside that li


    it('opens and closes opportunity detail modal', async () => {
        // mock opportunities response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ opportunities: [mockOpportunities[0]], tags: mockGlobalTagsOpps }),
        });

        renderWithRouter(<SearchPage />);

        // switch to opportunities mode
        const modeSelect = await screen.findByRole('combobox');
        await userEvent.selectOptions(modeSelect, 'opportunities');

        // open modal
        const oppCardButton = await screen.findByTestId(
            `opportunity-card-${mockOpportunities[0].opportunity_id}`
        );
        await userEvent.click(oppCardButton);

        // modal should show the new header and a form field
        expect(
            screen.getByRole('heading', {
                name: `Contact NGO about: ${mockOpportunities[0].title}`,
            })
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();

        // close it
        await userEvent.click(screen.getByRole('button', { name: /Close/i }));
        await waitFor(() => {
            expect(
                screen.queryByRole('heading', {
                    name: `Contact NGO about: ${mockOpportunities[0].title}`,
                })
            ).not.toBeInTheDocument();
        });
    });

    it('closes modal when "Send Inquiry" is clicked', async () => {
        // mock opportunities response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ opportunities: [mockOpportunities[0]], tags: mockGlobalTagsOpps }),
        });

        renderWithRouter(<SearchPage />);

        // switch to opportunities mode
        const modeSelect = await screen.findByRole('combobox');
        await userEvent.selectOptions(modeSelect, 'opportunities');

        // open modal
        const oppCardButton = await screen.findByTestId(
            `opportunity-card-${mockOpportunities[0].opportunity_id}`
        );
        await userEvent.click(oppCardButton);

        // wait for modal header
        await screen.findByRole('heading', {
            name: `Contact NGO about: ${mockOpportunities[0].title}`,
        });

        // fill required fields so the form will actually submit
        await userEvent.type(screen.getByLabelText(/Your Name/i), 'Test User');
        await userEvent.type(screen.getByLabelText(/Your Email/i), 'test@example.com');
        await userEvent.type(screen.getByLabelText(/Message/i), 'Hello!');

        // submit inquiry
        await userEvent.click(screen.getByRole('button', { name: /Send Inquiry/i }));

        // modal should close
        await waitFor(() => {
            expect(
                screen.queryByRole('heading', {
                    name: `Contact NGO about: ${mockOpportunities[0].title}`,
                })
            ).not.toBeInTheDocument();
        });
    });


    it('saves state to sessionStorage on mode change', async () => {
        renderWithRouter(<SearchPage />);
        await screen.findByText('NGO Alpha');

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                opportunities: [],
                tags: ['someTag'],
            }),
        });

        const modeSelect = screen.getByRole('combobox');
        await userEvent.selectOptions(modeSelect, 'opportunities');

        await waitFor(() => {
            expect(sessionStorage.setItem).toHaveBeenCalledWith(
                'searchState',
                JSON.stringify({ selectedTags: [], currentPage: 1, mode: 'opportunities' })
            );
        });
    });

    it('loads state from sessionStorage on initial render', async () => {
        const initialSearchState = { mode: 'opportunities', selectedTags: ['Environment'], currentPage: 2 };
        sessionStorage.setItem('searchState', JSON.stringify(initialSearchState));

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ opportunities: mockOpportunities, tags: mockGlobalTagsOpps }),
        });

        renderWithRouter(<SearchPage />);

        expect(fetch).toHaveBeenCalledWith('/api/opportunities');
        await waitFor(() => {
            expect(screen.getByText('Environment', { selector: 'aside li' })).toBeInTheDocument();
        });
        expect(screen.getByRole('combobox')).toHaveValue('opportunities');
    });

    // TODO: Add pagination, remove tags, find 0 ngos
});
