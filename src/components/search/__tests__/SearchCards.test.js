import React from 'react';
import {render, screen} from "@testing-library/react";  //allows for mock rendering onto DOM and finding elements
import userEvent from "@testing-library/user-event";    // allows for simulating clicking, typing and so on
import { MemoryRouter} from "react-router-dom";         // for routing
import { NGOCard, OpportunityCard} from "../SearchCards";

const mockNav = jest.fn();                              // mocking the useNavigate hook, allows to look at calls, examine urls

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom');
    return {
        __esModule: true, // Use this to make it an ES module mock
        ...originalModule, // Spread in all actual exports (like MemoryRouter, Link)
        useNavigate: () => mockNav, // Override only useNavigate
    };
});

describe("SearchCards components", () => {
    beforeEach(() => {
        mockNav.mockClear();        // clear history
    });

    describe("NGOCard", () => {
        const mockNgo = {
            ngo_id: 1,
            name: 'Helping Hands Org',
            tags: ['Community', 'Education'],
            description: 'A great organization helping the community.',         // only used properties needed
        };

        it('render NGO name, description, and tags correctly', () => {
            render(
                <MemoryRouter>                                                  {/* uses useNavigate, needs router context */}
                    <NGOCard ngo={mockNgo}/>
                </MemoryRouter>
            );

            // now is rendered, so we can use screen to examine what was rendered
            expect(screen.getByText('Helping Hands Org')).toBeInTheDocument()    // searches for element with provided text
            expect(screen.getByText('A great organization helping the community.')).toBeInTheDocument();
            expect(screen.getByText('Community')).toBeInTheDocument();
            expect(screen.getByText('Education')).toBeInTheDocument();
        });

        it('renders "View" and navigates on click', async () => {
            render(
                <MemoryRouter>
                    <NGOCard ngo={mockNgo}/>
                </MemoryRouter>
            );

            const viewButton = screen.getByRole('button', {name: /view/i}); //i is a flag in regex to specify case insensitive
            expect(viewButton).toBeInTheDocument();

            await userEvent.click(viewButton);

            expect(mockNav).toHaveBeenCalledTimes(1);
            expect(mockNav).toHaveBeenCalledWith('/ngos/1');
        })

        it('renders correctly even if tags array is empty', () => {
            const ngoWithNoTags = {...mockNgo, tags: []};
            render(
                <MemoryRouter>
                    <NGOCard ngo={ngoWithNoTags}/>
                </MemoryRouter>
            );
            expect(screen.getByText('Helping Hands Org')).toBeInTheDocument();
            // queryByText for elements that might not be there, to avoid throwing errors
            expect(screen.queryByText('Community')).not.toBeInTheDocument();
            expect(screen.queryByText('Education')).not.toBeInTheDocument();
        });

        describe('OpportunityCard', () => {
            const mockOpp = {
                opportunity_id: 10,
                title: 'Beach Cleanup Day',
                tags: ['Environment', 'Volunteering'],
                description: 'Join us for a fun day cleaning the beach.',
                location: 'Sunny Bay Beach',
                start: '2025-08-01T00:00:00.000Z',
                end: '2025-08-01T00:00:00.000Z',
                contact_email: 'volunteer@beachday.org',
                contact_phone: '555-123-4567',
            };
            const mockOpenModal = jest.fn();

            beforeEach(() => {
                mockOpenModal.mockClear();  
            });

            it('renders opportunity title, description, location, and tags correctly', () => {
                render(
                    <OpportunityCard opp={mockOpp} onOpenModal={mockOpenModal}/>
                );

                expect(screen.getByText('Beach Cleanup Day')).toBeInTheDocument();
                expect(screen.getByText('Join us for a fun day cleaning the beach.')).toBeInTheDocument();
                expect(screen.getByText('Sunny Bay Beach')).toBeInTheDocument();
                expect(screen.getByText('Environment')).toBeInTheDocument();
                expect(screen.getByText('Volunteering')).toBeInTheDocument();
            });

            it('renders "Apply" button and calls onOpenModal with the opportunity data on click', async () => {
                render(
                    <OpportunityCard opp={mockOpp} onOpenModal={mockOpenModal}/>
                );

                const applyButton = screen.getByRole('button', {name: /apply/i});
                expect(applyButton).toBeInTheDocument();

                await userEvent.click(applyButton);

                expect(mockOpenModal).toHaveBeenCalledTimes(1);
                expect(mockOpenModal).toHaveBeenCalledWith(mockOpp);
            });

            it('renders correctly if tags array is empty', () => {
                const oppWithNoTags = {...mockOpp, tags: []};
                render(
                    <OpportunityCard opp={oppWithNoTags} onOpenModal={mockOpenModal}/>
                );
                expect(screen.getByText('Beach Cleanup Day')).toBeInTheDocument();
                expect(screen.queryByText('Environment')).not.toBeInTheDocument();
                expect(screen.queryByText('Volunteering')).not.toBeInTheDocument();
            });
        });
    });
})