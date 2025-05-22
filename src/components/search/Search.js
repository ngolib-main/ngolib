import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {NGOCard, OpportunityCard} from "./SearchCards";
import Header from "../../components/reusable/Header";

import searchStyle from "../../style/page/search.module.css";
import tileboxStyle from "../../style/components/tilebox.module.css";

const prettyDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
    });

function OpportunityDetailModal({ open, onClose, opportunity }) {
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({ userName: '', userEmail: '', message: '' });
            setIsSubmitting(false);
        }
    }, [open, opportunity]);

    if (!open || !opportunity) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitInquiry = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Placeholder for sending the form data to the backend and sending an email
        console.log("--- Contact NGO Form Submission ---");
        console.log("Opportunity Title:", opportunity.title);
        console.log("Opportunity ID:", opportunity.opportunity_id);
        console.log("To NGO Contact Email (from opportunity object):", opportunity.contact_email);
        console.log("User Name:", formData.userName);
        console.log("User Email (for NGO to reply to):", formData.userEmail);
        console.log("Message:", formData.message);

        onClose();
    };

    return createPortal(
        <div className={tileboxStyle["modal-backdrop"]} onClick={onClose}>
            <div className={tileboxStyle["modal-content"]} onClick={(e) => e.stopPropagation()}>
                <h2>Contact NGO about: {opportunity.title}</h2>
                {opportunity.start && (
                    <p className={tileboxStyle.modalDates}>
                        <strong>Starts:</strong> {prettyDate(opportunity.start)}
                        {opportunity.end && (<> &nbsp;|&nbsp; <strong>Ends:</strong> {prettyDate(opportunity.end)}</>)} {/* nbsp is a non-breaking space, prevents line break between dates */}
                    </p>
                )}
                <form onSubmit={handleSubmitInquiry} className={searchStyle.modalForm}>
                    <div className={tileboxStyle['form-group']}>
                        <label htmlFor="userName">Your Name:</label>
                        <input
                            type="text"
                            id="userName"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className={tileboxStyle['form-group']}>
                        <label htmlFor="userEmail">Your Email:</label>
                        <input
                            type="email"
                            id="userEmail"
                            name="userEmail"
                            value={formData.userEmail}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className={tileboxStyle['form-group']}>
                        <label htmlFor="message">Message:</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="4"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className={tileboxStyle['modal-button-row']}>
                        <button
                            type="button"
                            className={`${tileboxStyle['modal-button']} ${tileboxStyle.secondary}`}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className={`${tileboxStyle['modal-button']} ${tileboxStyle.primary}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function TileBox({mode, items, currentPage, setCurrentPage, onOpenOpportunityModal}) {
    const cardsPerPage = 4;
    const total = Math.ceil(items.length / cardsPerPage);
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const visible = items.slice(start, end);

    return (
        <>
            <div className={tileboxStyle.tilebox}>
                {visible.length === 0 ? (
                    <div className={tileboxStyle["no-ngos"]}>No items match selected filters</div>
                )
                    : (visible.map(item =>
                            mode === 'ngos' ? (
                    <NGOCard
                        key={item.ngo_id}
                        ngo={item}
                    />
                ) : (
                    <OpportunityCard
                        key={item.opportunity_id}
                        opp={item}
                        onOpenModal={onOpenOpportunityModal}
                    />
                )
                ))}
            </div>
            <div className={tileboxStyle.pagination}>
                {Array.from({ length: total }, (_, i) => i + 1).map(page => (
                    <button
                        onClick={() => setCurrentPage(page)}
                        className={`${tileboxStyle['page-button']} ${page === currentPage ? tileboxStyle.active : ""}`}
                    >
                        {page}
                    </button>
                ))}
            </div>
        </>
    )
}

function SearchPage() {
    const [items, setItems] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true); //to wait until data loads
    const [currentPage, setCurrentPage] = useState(1);
    const [mode, setMode] = useState("ngos");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOpportunityForModal, setCurrentOpportunityForModal] = useState(null);

    useEffect(() => {
        const saved = sessionStorage.getItem("searchState");    //read from saved json state if present
        if (saved) {
            const { mode, selectedTags, currentPage } = JSON.parse(saved);
            if(selectedTags) setSelectedTags(selectedTags);
            if(currentPage) setCurrentPage(currentPage);
            if(mode) setMode(mode);
        }
    }, [])

    useEffect(() => {
        sessionStorage.setItem("searchState", JSON.stringify({  // on change of any state, save it to session storage
            selectedTags,
            currentPage,
            mode,
        }));
    }, [selectedTags, currentPage, mode]);

    useEffect(() => {                                           // run this when the component is mounted, then when mode changes
        fetch(`/api/${mode}`)
            .then(res => res.json())                        // wait for response, parse as json
            .then(({ ngos, opportunities, tags}) => {                   // returns either ngos and tags or opportunities and tags, if key not present just undefined
                setItems(ngos || opportunities);                   // merged items with tags[], grab either
                setTags(tags);                                      // flat array of all tag names
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [mode]);                                                // dependency array, run when mode changes

    const handleOpenOpportunityModal = (opportunityData) => {
        setCurrentOpportunityForModal(opportunityData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentOpportunityForModal(null);
    };

    if (loading) return <div>Loading…</div>;

    const verified = items.filter(it =>
        it.verified === true || it.verified === undefined
    );      // if undefined, means no verified fiels present, so not ngo but opportunity

    const filtered = selectedTags.length
        ? verified.filter(it =>
            selectedTags.every(tag => it.tags.includes(tag))
        )
        : verified;

    const handleTagClick = tag => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev : [...prev, tag]
        );
        setCurrentPage(1);  //reset the page after applying filters
    };

    const removeTag = tag => {
        setSelectedTags(prev => prev.filter(t => t !== tag));
    };

    return (
        <>
            <Header/>
            <div className={searchStyle.layout}>
                <main>
                    <TileBox
                        mode={mode}
                        items={filtered}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        onOpenOpportunityModal={handleOpenOpportunityModal}
                    />
                </main>
                <TagSidebar
                    mode={mode}
                    onModeChange={(value) => {
                        setMode(value);
                        setSelectedTags([]);
                        setCurrentPage(1);
                    }}
                    tags={tags}
                    selectedTags={selectedTags}
                    onTagClick={handleTagClick}
                    onRemove={removeTag}
                />
            </div>
            <OpportunityDetailModal
                open={isModalOpen}
                onClose={handleCloseModal}
                opportunity={currentOpportunityForModal}
            />
        </>
    ) // Fragment usage needed when more than one React element is returned
}

function TagSidebar({mode, onModeChange, tags, selectedTags, onTagClick, onRemove }) {
    const availableTags = tags
        .filter(t => !selectedTags.includes(t))
        .sort((a, b) => a.length - b.length);   // sort after filtering, provide a comparison function, that way efficient stacking

    return (
        // dynamic key for search style to override colour scheme
            <aside className={`${searchStyle.filter} ${searchStyle[mode]}`}>
                <select
                    value={mode}
                    onChange={e => onModeChange(e.target.value)}
                    className={searchStyle['select']} //TODO implement css
                >
                    <option value="ngos">Filter NGOs</option>
                    <option value="opportunities">Filter volunteering</option>
                </select>
                {selectedTags.length > 0 && (
                    <ul className={searchStyle['selected-tags']}>
                        {selectedTags.map(tag => (
                            <li key={tag}>
                                {tag}
                                <button onClick={() => onRemove(tag)}>X</button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className={searchStyle['tag-options']}>
                    {availableTags.map(tag => (
                        <button key={tag} onClick={() => onTagClick(tag)}>
                            {tag}
                        </button>
                    ))}
                </div>
            </aside>
    )
}

export default SearchPage;