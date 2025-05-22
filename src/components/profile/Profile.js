import React, { useEffect, useRef, useState } from "react";
import styles from '../../style/page/profile.module.css';
import { displayedSectionsUser, displayedSectionsNGO } from "./displaySections";
import Header from "../reusable/Header";

const Profile = () => {
    // State: which accordion indexes are open
    const [openSections, setOpenSections] = useState([]);
    // State: fetched profile data (user or NGO and related arrays)
    const [PersonalInfo, setPersonalInfo] = useState(null);
    // Ref: hidden file input to trigger click when "Add picture" pressed
    const fileInputRef = useRef(null);

    // Fetch profile data once on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/profile", {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await response.json();
                console.log("Profile data:", data);
                setPersonalInfo(data);
            } catch (error) {
                alert("Something went wrong, try again later");
            }
        };
        fetchProfile();
    }, []);


    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    // Handler: on file selected → read Base64 → POST to server
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return alert("Wrong file — try again");

        const reader = new FileReader();
        reader.onload = async () => {
            const imageBase64 = reader.result;
            try {
                const res = await fetch("/api/profile/image", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64 }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || "Upload failed");
                }
                await res.json();
                alert("Upload successful");
                // Update image in local state so UI refreshes immediately
                setPersonalInfo(prev => ({ ...prev, image: imageBase64 }));
            } catch (uploadError) {
                console.error("Error uploading image:", uploadError);
                alert("Error uploading image: " + uploadError.message);
            }
        };
        reader.readAsDataURL(file);
    };

    // Handler: toggle accordion open/closed
    const toggleSection = (index) => {
        setOpenSections(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    // Loading state until data arrives
    if (!PersonalInfo) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading profile data...</p>
            </div>
        );
    }

    // Determine user vs NGO
    const user = PersonalInfo.user || {};
    const userType = user.type || "NGO"; // default to NGO
    const isUser = userType === "user";

    // Pick accordion sections based on type
    const displayedSections = isUser ? displayedSectionsUser : displayedSectionsNGO;

    // Handlers for unfollow/unsubscribe:
    // these update state without refetching all data
    const handleUnfollow = async (ngoId) => {
        try {
            const res = await fetch("/api/profile/unfollow", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ngoId }),
            });
            if (!res.ok) throw new Error((await res.json()).message || "Failed to unfollow");
            setPersonalInfo(prev => ({
                ...prev,
                followings: (prev.followings || []).filter(f => f.ngo_id !== ngoId),
            }));
            alert("You have unfollowed the NGO.");
        } catch (err) {
            console.error(err);
        }
    };

    // these update state without refetching all dat
    const handleUnsubscribe = async (ngoId) => {
        try {
            await fetch("/api/profile/unsubscribe", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ngoId }),
            });
            setPersonalInfo(prev => ({
                ...prev,
                subscriptions: (prev.subscriptions || []).map(sub =>
                    sub.ngo_id === ngoId ? { ...sub, status: "canceled" } : sub
                ),
            }));
            alert("You have unsubscribed from the NGO.");
        } catch (err) {
            console.error(err);
        }
    };

    // Render user/NGO basic info
    const renderPersonalInfo = () => {
        if (isUser) {
            return (
                <div className={styles.info}>
                    {/* Display username & email for regular users */}
                    <h2>{user.username}</h2>
                    <p>Email: {user.email}</p>
                </div>
            );
        }
        // NGO: may return 'user' as array, so handle both
        const org = Array.isArray(PersonalInfo.user) ? PersonalInfo.user[0] : PersonalInfo.user;
        return (
            <div className={styles.info}>
                <h2>{org.name || "Unnamed NGO"}</h2>
                <p>Contact: {org.contact_email || "No contact"}</p>
                <p>
                    Link:{' '}
                    {org.website_url ? (
                        <a href={org.website_url} target="_blank" rel="noreferrer">
                            Visit site
                        </a>
                    ) : (
                        "No link"
                    )}
                </p>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.profileWrapper}>
                {/* Left sidebar: picture & basic info */}
                <aside className={styles.leftSideBar}>
                    <div className={styles.photoSection}>
                        <img
                            className={styles.profilePic}
                            src={PersonalInfo.image || "ngo_icon.png"}
                            alt="Profile"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button
                            className={styles.uploadButton}
                            onClick={handlePhotoClick}
                        >
                            Add picture
                        </button>
                    </div>
                    {/* Render either user or NGO details */}
                    <div className={styles.informationContainer}>
                        {renderPersonalInfo()}
                    </div>
                </aside>

                {/* Right sidebar: accordions for followings, subscriptions, etc. */}
                <section className={styles.rightSideBar}>
                    {displayedSections.map((section, index) => {
                        // Determine which array to use for each section index
                        let data = [];
                        if (index === 0) data = PersonalInfo.followings || [];
                        if (index === 1) data = isUser ? PersonalInfo.subscriptions || [] : PersonalInfo.followers || [];
                        if (index === 2) data = PersonalInfo.donations || [];
                        if (index === 3) data = PersonalInfo.post_volunt || [];

                        const isOpen = openSections.includes(index);

                        return (
                            <div className={styles.accordionSection} key={index}>
                                <div
                                    className={styles.accordionTitle}
                                    onClick={() => toggleSection(index)}
                                >
                                    {section.title}
                                </div>

                                <div className={`${styles.accordionContent} ${isOpen ? styles.open : ''}`}>
                                    <ul>
                                        {/* Special link for NGOs to create volunteering posts */}
                                        {index === 3 && (
                                            <li className={styles.linkWrapper}>
                                                <a
                                                    href="/post-volunteer"
                                                    className={styles.linkRedirect}
                                                >
                                                    Create new volunteering post
                                                </a>
                                            </li>
                                        )}

                                        {data.length > 0 ? (
                                            data.map((item, i) => (
                                                <li key={i} className={styles.followerItem}>
                                                    <div className={styles.followerInfo}>
                                                        <strong>
                                                            {/* display whichever name/title is available */}
                                                            {item.ngo_name || item.username || item.name || item.title}
                                                        </strong>
                                                        <div
                                                            style={{
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                color: item.status === 'active' ? 'green' : 'red',
                                                            }}
                                                        >
                                                            {item.status}
                                                        </div>
                                                    </div>

                                                    <div className={styles.followerActions}>
                                                        {item.amount != null && <span>{`${item.amount} €`}</span>}
                                                        {index === 0 && (
                                                            <button
                                                                className={styles.unfollowButton}
                                                                onClick={() => handleUnfollow(item.ngo_id)}
                                                            >
                                                                Unfollow
                                                            </button>
                                                        )}
                                                        {index === 1 && isUser && item.status !== 'canceled' && (
                                                            <button
                                                                className={styles.unfollowButton}
                                                                onClick={() => handleUnsubscribe(item.ngo_id)}
                                                            >
                                                                Unsubscribe
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))
                                        ) : section.item ? (
                                            <li className={styles.linkWrapper}>
                                                <div className={styles.linkContent}>
                                                    <p>{section.item.text}</p>
                                                    <a
                                                        href={section.item.href}
                                                        className={styles.linkRedirect}
                                                    >
                                                        Edit my page
                                                    </a>
                                                </div>
                                            </li>
                                        ) : (
                                            <li>Nothing yet</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </section>
            </div>
        </div>
    );
};

export default Profile;
