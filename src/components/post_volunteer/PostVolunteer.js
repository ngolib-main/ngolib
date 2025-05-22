import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../style/page/postVolunteer.module.css';
import Header from '../reusable/Header';


function PostVolunteer() {
    const navigate = useNavigate();
    const [state, setState] = useState({
        loading: true,
        error: null,
        ngoContact: null,
        formData: {
            title: '',
            description: '',
            location: '',
            start: '',
            end: '',
        },
    });


useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const contactResponse = await fetch('/api/profile/ngo-contact', {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!contactResponse.ok) {
                const { error } = await contactResponse.json();
                throw new Error(error || 'Failed to fetch NGO info');
            }

            // parse JSON (could be an array OR an object)
            const raw = await contactResponse.json();
            console.log("Raw fetch result:", raw);

            // normalize to an object
            let contactData = {};
            if (Array.isArray(raw)) {
                contactData = raw[0] || {};
            } else if (raw && typeof raw === 'object') {
                contactData = raw;
            }

            console.log("Normalized contactData:", contactData);

            setState(prev => ({
                ...prev,
                loading: false,
                ngoContact: {
                    ngo:   contactData.ngo_id           ?? 'Not available',
                    email: contactData.contact_email    ?? 'Not available',
                    phone: contactData.phone_nr         ?? 'Not available',
                },
            }));
        } catch (error) {
            console.error("Error in fetchInitialData:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
            }));
        }
    };

    fetchInitialData();
}, []);




const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
        ...prev,
        formData: {
            ...prev.formData,
            [name]: value
        }
    }));
};

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch('/api/postOpportunity', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(state.formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Opportunity submission failed');
        }

        navigate(`/profile`, {
            state: { successMessage: 'Opportunity posted successfully!' }
        });

    } catch (error) {
        setState(prev => ({
            ...prev,
            loading: false,
            error: error.message
        }));
    }
};

const handleCancel = () => {
    navigate(-1);
};

if (state.loading) {
    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading NGO information...</p>
            </div>

        </div>
    );
}

if (state.error) {
    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.errorContainer}>
                <h2>Error</h2>
                <p className={styles.errorMessage}>{state.error}</p>
                <button
                    onClick={handleCancel}
                    className={styles.button}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}

return (
    <>
        <Header />
        <div className={styles.container}>
            <h1>Post a Volunteering Opportunity</h1>
            <form onSubmit={handleSubmit}className={styles.volunteerForm}>
                <div className={styles.leftCol}>
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={state.formData.title}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={state.formData.description}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="location">Location:</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={state.formData.location}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.rightCol}>
                    <div className={styles.dateGrid}>
                        <div>
                            <label htmlFor="start">Start Date:</label>
                            <input
                                type="date"
                                id="start"
                                name="start"
                                value={state.formData.start}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="end">End Date:</label>
                            <input
                                type="date"
                                id="end"
                                name="end"
                                value={state.formData.end}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.contactInfo}>
                        <h2>Contact Information</h2>
                        <div className={styles.contactDetails}>
                            <p><strong>Email:</strong> {state.ngoContact?.email || 'Loading...'}</p>
                            <p><strong>Phone:</strong> {state.ngoContact?.phone || 'Loading...'}</p>
                        </div>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="button" onClick={handleCancel} className={styles.secondaryButton}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.primaryButton}>
                            {state.loading ? 'Posting...' : 'Post Opportunity'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </>
);
}

export default PostVolunteer;
