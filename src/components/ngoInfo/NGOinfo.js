import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../../style/page/ngoInfo.module.css';
import Header from '../reusable/Header';
import Footer from '../reusable/Footer';

function NGOinfoPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState({
        loading: true,
        error: null,
        ngo: null
    });

    const handleBack = () => navigate(-1);

    useEffect(() => {
        const abortController = new AbortController();
        const timeoutDuration = 10000; // 10 seconds

        const fetchNGOData = async () => {
            try {
                const timeout = setTimeout(() => {
                    abortController.abort();
                }, timeoutDuration);

                const response = await fetch(`/api/ngos/${id}`, {
                    signal: abortController.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data.ngo_id) {
                    throw new Error('Invalid NGO data structure from server');
                }

                setState({
                    loading: false,
                    error: null,
                    ngo: {
                        ...data,
                        image: data.image || '/images/default-ngo.jpg',
                        tags: data.tags || [],
                        followers: data.followers || []
                    }
                });

            } catch (error) {
                setState({
                    loading: false,
                    error: error.name === 'AbortError'
                        ? 'Request timed out. Please try again.'
                        : error.message,
                    ngo: null
                });
            }
        };

        if (id && !isNaN(id)) {
            fetchNGOData();
        } else {
            setState({
                loading: false,
                error: 'Invalid NGO ID format',
                ngo: null
            });
        }

        return () => abortController.abort();
    }, [id]);

    if (state.loading) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading NGO details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (state.error) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.errorContainer}>
                    <h2>Error Loading NGO</h2>
                    <p className={styles.errorMessage}>{state.error}</p>
                    <button
                        onClick={handleBack}
                        className={styles.backButton}
                    >
                        ← Back to Search
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    if (!state.ngo) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.notFoundContainer}>
                    <h2>NGO Not Found</h2>
                    <button
                        onClick={handleBack}
                        className={styles.backButton}
                    >
                        ← Return to Search
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Header />

            <div className={styles.content}>

                <div className={styles.topSection}>

                    <div className={styles.infoContainer}>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{state.ngo.name}</h1>
                            {state.ngo.verified && (
                                <span className={styles.verifiedBadge}>Verified</span>
                            )}
                        </div>

                        <div className={styles.tags}>
                            {state.ngo.tags.map((tag, index) => (
                                <span key={`tag-${index}`} className={styles.tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className={styles.description}>
                            {state.ngo.description}
                        </div>
                    </div>
                </div>

                <div className={styles.bottomSection}>
                    <div className={styles.contactInfo}>
                        <h2 className={styles.sectionTitle}>Contact Information</h2>
                        <div className={styles.contactItem}>
                            <span className={styles.contactLabel}>Email:</span>
                            <a
                                href={`mailto:${state.ngo.contact_email}`}
                                className={styles.contactLink}
                            >
                                {state.ngo.contact_email}
                            </a>
                        </div>
                        {state.ngo.phone_nr && (
                            <div className={styles.contactItem}>
                                <span className={styles.contactLabel}>Phone:</span>
                                <span className={styles.contactValue}>
                                    {state.ngo.phone_nr}
                                </span>
                            </div>
                        )}
                        <div className={styles.contactItem}>
                            <span className={styles.contactLabel}>Website:</span>
                            <a
                                href={state.ngo.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.contactLink}
                            >
                                {state.ngo.website_url}
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.buttonRow}>

                    {/* TODO implement follow functionality*/}
                    <button
                        className={styles.followButton}
                    >
                        Follow
                    </button>

                    {/*TODO implement subscribe functionality*/}
                    <button
                        className={styles.subscribeButton}
                    >
                        Subscribe
                    </button>

                    <button
                        onClick={() => navigate(`/payment/${id}`)}
                        className={styles.donateButton}
                    >
                        Donate
                    </button>
                </div>

            </div>

            <Footer />
        </div>
    );
}

export default NGOinfoPage;
