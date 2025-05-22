/*
 *  -- Admin.js --
 *
 *
 *
 */

import * as React from 'react';
import {useEffect, useRef, useState} from "react";
import Header from "../reusable/Header";
import {displayedSectionsAdmin} from "../profile/displaySections";
import styles from "../../style/page/profile.module.css";

function Admin() {
    const [openSections, setOpenSections] = useState([]);
    const [PersonalInfo, setPersonalInfo] = useState(null);
    const fileInputRef = useRef(null);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/profile", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();
                console.log(data)
                setPersonalInfo(data);
            } catch (error) {
                alert("Something went wrong, try again later")
            }
        };
        fetchProfile();
    }, []);

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return alert("Wrong file — try again");
        }

        // Use FileReader to get Base64
        const reader = new FileReader();
        reader.onload = async () => {
            const imageBase64 = reader.result;

            try {
                const res = await fetch("/api/profile/image", {
                    method: "POST",
                    credentials: "include",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({imageBase64}),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || "Upload failed");
                }

                const data = await res.json();
                console.log("Upload successful:", data);
                alert("Upload successful");
                setPersonalInfo(prev => ({
                    ...prev,
                    image: imageBase64
                }));
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Error uploading image: " + error.message);
            }
        };

        reader.readAsDataURL(file);
    };

    const toggleSection = (index) => {
        setOpenSections((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    // Add this function to handle adding a new tag
    const handleAddTag = async () => {
        if (newTag.trim()) {
            try {
                // API call to add a tag
                const response = await fetch("/api/admin/tag", {
                    method: "POST",
                    credentials: "include",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({tag: newTag}),
                });
                const data = await response.json();

                if (response.ok) {

                    // Update local state to show the new tag
                    setPersonalInfo(prev => ({
                        ...prev,
                        tags: [
                            [...prev.tags[0], {tag: newTag, ...data}]
                        ]
                    }));

                    // Clear the input
                    setNewTag('');

                    // Success alert
                    alert(`Tag "${newTag}" has been successfully added!`);

                    // Force a re-render of the accordion by adding a small delay
                    setTimeout(() => {
                        // This will trigger a re-render and potentially fix the accordion sizing
                        setPersonalInfo(prev => ({...prev}));

                        // Alternatively, you could dispatch a window resize event
                        window.dispatchEvent(new Event('resize'));
                    }, 100);

                    // Log the admin action
                    try {
                        // Assuming admin_id and ngo_id are available in your component
                        // You might need to adjust this based on your actual data structure
                        const adminActionResponse = await fetch('/api/admin/actions', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                ngo_id: null, // Assuming this is available in your state
                                admin_id: PersonalInfo.adminId, // Assuming this is available in your state
                                action_type: 'tag_added',
                                action_details: `New tag with name ${newTag} was added`
                            })
                        });

                        if (!adminActionResponse.ok) {
                            console.error('Failed to log admin action');
                        }
                    } catch (actionErr) {
                        console.error('Error logging admin action:', actionErr);
                        // Not alerting the user about this error since the main operation succeeded
                    }
                } else {
                    // Handle specific error cases
                    if (response.status === 409) {
                        alert(`Error: Tag "${newTag}" already exists.`);
                    } else {
                        alert(`Error: ${data.message || "Failed to add tag. Please try again."}`);
                    }
                }

            } catch (err) {
                console.error(err);
                alert("Error adding tag");
            }
        }
    };


    // Function to change the status of a subscription (active/canceled)
    /* const handleStatusChange = async (subscriptionId, currentStatus, ngoId) => {
         const newStatus = currentStatus === 'active' ? 'canceled' : 'active';

         // Add confirmation dialog
         const confirmAction = window.confirm(
             `Are you sure you want to change this subscription status from "${currentStatus}" to "${newStatus}"?`
         );

         // Only proceed if the user confirms
         if (!confirmAction) {
             return; // Exit the function if user cancels
         }

         try {
             const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/status`, {
                 method: "PUT",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ status: newStatus }),
             });

             if (response.ok) {
                 // Update only that subscription's status locally
                 setPersonalInfo(prev => {
                     const updatedSubs = prev.allSubscriptions.map(sub =>
                         sub.subscription_id === subscriptionId ? { ...sub, status: newStatus } : sub
                     );
                     return { ...prev, allSubscriptions: updatedSubs };
                 });

                 // Log the admin action
                 try {
                     // Assuming admin_id and ngo_id are available in your component
                     // You might need to adjust this based on your actual data structure
                     const adminActionResponse = await fetch('/api/admin/actions', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             ngo_id: ngoId, // Assuming this is available in your state
                             admin_id: PersonalInfo.adminId, // Assuming this is available in your state
                             action_type: 'subscription_status_change',
                             action_details: `Changed subscription ${subscriptionId} status from ${currentStatus} to ${newStatus}`
                         })
                     });

                     if (!adminActionResponse.ok) {
                         console.error('Failed to log admin action');
                     }
                 } catch (actionErr) {
                     console.error('Error logging admin action:', actionErr);
                     // Not alerting the user about this error since the main operation succeeded
                 }

             } else {
                 alert("Failed to update subscription status");
             }
         } catch (err) {
             console.error(err);
             alert("Error updating status");
         }
     };*/

    // Modified handleStatusChange function for the filtered list scenario
    const handleStatusChange = async (subscriptionId, currentStatus, ngoId) => {
        const newStatus = currentStatus === 'active' ? 'canceled' : 'active';

        // Add confirmation dialog
        const confirmAction = window.confirm(
            `Are you sure you want to change this subscription status from "${currentStatus}" to "${newStatus}"?`
        );

        // Only proceed if the user confirms
        if (!confirmAction) {
            return; // Exit the function if user cancels
        }

        try {
            const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/status`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({status: newStatus}),
            });

            if (response.ok) {
                // Update state to reflect the status change in both original and filtered lists
                setPersonalInfo(prev => {
                    // Update in the original allSubscriptions array
                    const updatedSubs = prev.allSubscriptions.map(sub =>
                        sub.subscription_id === subscriptionId ? {...sub, status: newStatus} : sub
                    );

                    // If we have a filtered list, update it too
                    let updatedFiltered = prev.filteredSubscriptions;
                    if (prev.isFiltered && prev.filteredSubscriptions) {
                        updatedFiltered = prev.filteredSubscriptions.map(sub =>
                            sub.subscription_id === subscriptionId ? {...sub, status: newStatus} : sub
                        );
                    }

                    return {
                        ...prev,
                        allSubscriptions: updatedSubs,
                        filteredSubscriptions: updatedFiltered
                    };
                });

                // Log the admin action
                try {
                    const adminActionResponse = await fetch('/api/admin/actions', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            ngo_id: ngoId,
                            admin_id: PersonalInfo.adminId,
                            action_type: 'subscription_status_change',
                            action_details: `Changed subscription ${subscriptionId} status from ${currentStatus} to ${newStatus}`
                        })
                    });

                    if (!adminActionResponse.ok) {
                        console.error('Failed to log admin action');
                    }
                } catch (actionErr) {
                    console.error('Error logging admin action:', actionErr);
                }

            } else {
                alert("Failed to update subscription status");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating status");
        }
    };

    const handleReportDonation = async (donation_id) => {

    }


    const handleRedirectVerification = async (ngo_id) => {
        try {
            // Create a hidden form and submit it for a proper POST navigation
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/admin/verify-NGOs';

            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'ngo_id';
            hiddenField.value = ngo_id;

            form.appendChild(hiddenField);
            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            console.error("Error redirecting to verification:", err);
            alert("Error navigating to verification page. Please try again.");
        }
    };


    const handleRemoveTag = async (tag_id, tag_name) => {
        // Add confirmation dialog
        const confirmAction = window.confirm(
            "Are you sure you want to delete this tag?"
        );

        // Only proceed if the user confirms
        if (!confirmAction) {
            return; // Exit the function if user cancels
        }

        try {
            const response = await fetch(`/api/admin/delete-tag`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({tag_id: tag_id}),
            });

            const data = await response.json();

            if (response.ok) {

                // Force a complete refresh of profile data
                // NOTE: Use this as a last resource if the stupid list of tags is not updating  after removal
                /*
                try {
                    const profileResponse = await fetch("/api/profile", {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    if (profileResponse.ok) {
                        const updatedData = await profileResponse.json();
                        setPersonalInfo(updatedData);
                        console.log("Profile data refreshed after tag deletion");
                    } else {
                        console.error("Failed to refresh profile data");
                    }

                } catch (refreshError) {
                    console.error("Error refreshing data:", refreshError);
                }*/

                // If deletion was successful, manually update the UI
                // Force a full component refresh by creating a new copy of PersonalInfo
                const updatedTags = [...PersonalInfo.tags];

                // Filter out the deleted tag
                if (Array.isArray(updatedTags[0])) {
                    updatedTags[0] = updatedTags[0].filter(tag => {
                        // Try to accommodate different ID field names
                        const tagIdentifier = tag.id || tag._id || tag.tag_id;
                        return tagIdentifier !== tag_id;
                    });
                }

                console.log("Tags after filtering:", updatedTags);

                // Create a completely new copy of the state to ensure React detects changes
                const newPersonalInfo = {
                    ...PersonalInfo,
                    tags: updatedTags
                };

                console.log("New PersonalInfo:", newPersonalInfo);

                // Update the state with the new object
                setPersonalInfo(newPersonalInfo);


                // Success alert
                alert("Tag has been successfully deleted!");

                // Log the admin action if you want to track this
                try {
                    await fetch('/api/admin/actions', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        credentials: "include",
                        body: JSON.stringify({
                            admin_id: PersonalInfo.adminId,
                            action_type: 'tag_deleted',
                            action_details: `Deleted tag with ID ${tag_id}, and name ${tag_name}`
                        })
                    });


                } catch (actionErr) {
                    console.error('Error logging admin action:', actionErr);
                    // Not alerting the user about this error since the main operation succeeded
                }
            } else {
                // Handle specific error cases
                if (response.status === 409) {
                    alert("Cannot delete this tag as it is currently in use by one or more NGOs.");
                } else if (response.status === 404) {
                    alert("Tag not found. It may have been already deleted.");

                    // Still update the UI to remove it if it was somehow still in the UI
                    setPersonalInfo(prev => ({
                        ...prev,
                        tags: [
                            prev.tags[0].filter(tag => tag.id !== tag_id)
                        ]
                    }));
                } else {
                    alert(`Error: ${data.message || "Failed to delete tag."}`);
                }
            }
        } catch (err) {
            console.error("Error deleting tag:", err);
            alert("Network error: Could not connect to the server. Please check your connection and try again.");
        }

    };


    if (!PersonalInfo) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading profile data...</p>
            </div>
        );
    }

    const user = PersonalInfo.user || {};
    const displayedSections = displayedSectionsAdmin;
    const subscriptions = PersonalInfo.allSubscriptions || [];
    const donations = PersonalInfo.allDonations || [];
    const actions = PersonalInfo.actions || [];
    const tags = PersonalInfo.tags[0] || [];
    const verifications = PersonalInfo.verifications || [];

    const renderPersonalInfo = () => {
        return (
            <div className={styles.info}>
                <h2>{user.username || "Unnamed admin"}</h2>
                <p>Email: {user.email || "No email provided"}</p>

                {/* SUBSCRIPTIONS CONTROLS */}
                {/* Only show tag input and button when subscriptions section (index 0) is open */}
                {openSections.includes(0) && (
                    <div className={styles.tagInputContainer}>
                        <h4>Subscriptions filters</h4>
                        {/* First row */}
                        <div className={styles.filterRow}>
                            Filter by NGO:
                            <select
                                value={PersonalInfo.selectedNgo || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    selectedNgo: e.target.value
                                }))}
                                className={styles.Select}
                            >
                                <option value="">Select NGO</option>
                                {/* Create a unique list of NGOs sorted alphabetically */}
                                {[...new Map(subscriptions.map(sub => [sub.ngo_id, sub]))
                                    .values()]
                                    .sort((a, b) => a.ngo_name.localeCompare(b.ngo_name))
                                    .map(sub => (
                                        <option key={sub.ngo_id} value={sub.ngo_id}>
                                            {sub.ngo_name}
                                        </option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Log selected value for debugging
                                    console.log("Selected NGO ID:", PersonalInfo.selectedNgo);
                                    console.log("All subscriptions:", subscriptions);

                                    if (PersonalInfo.selectedNgo) {
                                        // Show only subscriptions for the selected NGO
                                        const filtered = subscriptions.filter(
                                            sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                        );

                                        console.log("Filtered subscriptions:", filtered);

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredSubscriptions: filtered,
                                            subscriptionsFiltered: true
                                        }));
                                    } else {
                                        // If no NGO selected or "Select NGO" is chosen, show all
                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredSubscriptions: subscriptions,
                                            subscriptionsFiltered: false
                                        }));
                                    }
                                }}
                            >
                                Filter

                            </button>
                        </div>
                        {/* Second row */}
                        <div className={styles.filterRow}>
                            Filter by user:
                            <select
                                value={PersonalInfo.selectedUser || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    selectedUser: e.target.value
                                }))}
                                className={styles.Select}
                            >
                                <option value="">Select user</option>
                                {/* Create a unique list of NGOs sorted alphabetically */}
                                {[...new Map(subscriptions.map(sub => [sub.user_id, sub]))
                                    .values()]
                                    .sort((a, b) => String(a.user_id).localeCompare(String(b.user_id)))
                                    .map(sub => (
                                        <option key={sub.user_id} value={sub.user_id}>
                                            {sub.user_id}
                                        </option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Always start with the original subscription list for user filtering
                                    let filtered = [...subscriptions];

                                    if (PersonalInfo.selectedUser) {
                                        // Filter by selected user_id
                                        filtered = filtered.filter(
                                            sub => String(sub.user_id) === String(PersonalInfo.selectedUser)
                                        );

                                        // Re-apply other filters if they were active
                                        if (PersonalInfo.minAmount) {
                                            filtered = filtered.filter(sub =>
                                                parseFloat(sub.amount) >= parseFloat(PersonalInfo.minAmount)
                                            );
                                        }

                                        if (PersonalInfo.maxAmount) {
                                            filtered = filtered.filter(sub =>
                                                parseFloat(sub.amount) <= parseFloat(PersonalInfo.maxAmount)
                                            );
                                        }

                                        // Apply NGO filter if active
                                        if (PersonalInfo.selectedNgo) {
                                            filtered = filtered.filter(
                                                sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                            );
                                        }

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredSubscriptions: filtered,
                                            subscriptionsFiltered: true,
                                            userFilterApplied: true
                                        }));
                                    } else {
                                        // If no user is selected, apply other filters if they exist
                                        let resetFiltered = [...subscriptions];

                                        // Re-apply other filters
                                        if (PersonalInfo.minAmount) {
                                            resetFiltered = resetFiltered.filter(sub =>
                                                parseFloat(sub.amount) >= parseFloat(PersonalInfo.minAmount)
                                            );
                                        }

                                        if (PersonalInfo.maxAmount) {
                                            resetFiltered = resetFiltered.filter(sub =>
                                                parseFloat(sub.amount) <= parseFloat(PersonalInfo.maxAmount)
                                            );
                                        }

                                        // Apply NGO filter if active
                                        if (PersonalInfo.selectedNgo) {
                                            resetFiltered = resetFiltered.filter(
                                                sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                            );
                                        }

                                        const stillFiltered = PersonalInfo.minAmount ||
                                            PersonalInfo.maxAmount ||
                                            PersonalInfo.selectedNgo;

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredSubscriptions: stillFiltered ? resetFiltered : null,
                                            subscriptionsFiltered: !!stillFiltered,
                                            userFilterApplied: false
                                        }));
                                    }
                                }}
                            >
                                Filter
                            </button>
                        </div>
                        {/* Third row */}
                        <div className={styles.filterRow}>
                            Filter by value:
                            <input
                                type="number"
                                placeholder="Min amount"
                                value={PersonalInfo.minAmount || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    minAmount: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <input
                                type="number"
                                placeholder="Max amount"
                                value={PersonalInfo.maxAmount || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    maxAmount: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Always start with the original subscriptions
                                    let filtered = [...subscriptions];

                                    // Apply user filter if it's active
                                    if (PersonalInfo.selectedUser) {
                                        filtered = filtered.filter(
                                            sub => String(sub.user_id) === String(PersonalInfo.selectedUser)
                                        );
                                    }

                                    // Apply NGO filter if it's active
                                    if (PersonalInfo.selectedNgo) {
                                        filtered = filtered.filter(
                                            sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                        );
                                    }

                                    // Apply min amount filter if provided
                                    if (PersonalInfo.minAmount) {
                                        const minValue = parseFloat(PersonalInfo.minAmount);
                                        filtered = filtered.filter(sub =>
                                            parseFloat(sub.amount) >= minValue
                                        );
                                    }

                                    // Apply max amount filter if provided
                                    if (PersonalInfo.maxAmount) {
                                        const maxValue = parseFloat(PersonalInfo.maxAmount);
                                        filtered = filtered.filter(sub =>
                                            parseFloat(sub.amount) <= maxValue
                                        );
                                    }

                                    // Determine if any filter is applied
                                    const isAnyFilterApplied = PersonalInfo.selectedUser ||
                                        PersonalInfo.selectedNgo ||
                                        PersonalInfo.minAmount ||
                                        PersonalInfo.maxAmount;

                                    // Update state with filtered data
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        filteredSubscriptions: isAnyFilterApplied ? filtered : null,
                                        subscriptionsFiltered: !!isAnyFilterApplied,
                                        amountFilterApplied: !!(PersonalInfo.minAmount || PersonalInfo.maxAmount)
                                    }));

                                }}
                            >
                                Filter
                            </button>
                        </div>
                        {/* Third row */}
                        <div className={styles.filterRow}>
                            <button
                                type="button"
                                className={styles.cleanButton}
                                onClick={() => {
                                    // Reset all filters
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        selectedNgo: '',
                                        minAmount: '',
                                        maxAmount: '',
                                        filteredSubscriptions: null,
                                        subscriptionsFiltered: false,
                                        amountFilterApplied: false
                                    }));
                                }}
                            >
                                Clean filters
                            </button>
                        </div>
                    </div>
                )}

                {/* DONATIONS CONTROL */}
                {/* Only show tag input and button when donations section (index 1) is open */}

                {openSections.includes(1) && (
                    <div className={styles.tagInputContainer}>
                        <h4>Donations filters</h4>
                        {/* First row */}
                        <div className={styles.filterRow}>
                            Filter by NGO:
                            <select
                                value={PersonalInfo.selectedNgo || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    selectedNgo: e.target.value
                                }))}
                                className={styles.Select}
                            >
                                <option value="">Select NGO</option>
                                {/* Create a unique list of NGOs sorted alphabetically */}
                                {[...new Map(donations.map(sub => [sub.ngo_id, sub]))
                                    .values()]
                                    .sort((a, b) => a.ngo_name.localeCompare(b.ngo_name))
                                    .map(sub => (
                                        <option key={sub.ngo_id} value={sub.ngo_id}>
                                            {sub.ngo_name}
                                        </option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Log selected value for debugging
                                    console.log("Selected NGO ID:", PersonalInfo.selectedNgo);
                                    console.log("All donations:", donations);

                                    if (PersonalInfo.selectedNgo) {
                                        // Show only subscriptions for the selected NGO
                                        const filtered = donations.filter(
                                            sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                        );

                                        console.log("Filtered donations:", filtered);

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredDonations: filtered,
                                            donationsFiltered: true
                                        }));
                                    } else {
                                        // If no NGO selected or "Select NGO" is chosen, show all
                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredDonations: donations,
                                            donationsFiltered: false
                                        }));
                                    }
                                }}
                            >
                                Filter

                            </button>
                        </div>
                        {/* Second row */}
                        <div className={styles.filterRow}>
                            Filter by user:
                            <select
                                value={PersonalInfo.selectedUser || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    selectedUser: e.target.value
                                }))}
                                className={styles.Select}
                            >
                                <option value="">Select user</option>
                                {/* Create a unique list of NGOs sorted alphabetically */}
                                {[...new Map(donations.map(sub => [sub.user_id, sub]))
                                    .values()]
                                    .sort((a, b) => String(a.user_id).localeCompare(String(b.user_id)))
                                    .map(sub => (
                                        <option key={sub.user_id} value={sub.user_id}>
                                            {sub.user_id}
                                        </option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Always start with the original subscription list for user filtering
                                    let filtered = [...donations];

                                    if (PersonalInfo.selectedUser) {
                                        // Filter by selected user_id
                                        filtered = filtered.filter(
                                            sub => String(sub.user_id) === String(PersonalInfo.selectedUser)
                                        );

                                        // Re-apply other filters if they were active
                                        if (PersonalInfo.minAmount) {
                                            filtered = filtered.filter(sub =>
                                                parseFloat(sub.amount) >= parseFloat(PersonalInfo.minAmount)
                                            );
                                        }

                                        if (PersonalInfo.maxAmount) {
                                            filtered = filtered.filter(sub =>
                                                parseFloat(sub.amount) <= parseFloat(PersonalInfo.maxAmount)
                                            );
                                        }

                                        // Apply NGO filter if active
                                        if (PersonalInfo.selectedNgo) {
                                            filtered = filtered.filter(
                                                sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                            );
                                        }

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredDonations: filtered,
                                            donationsFiltered: true,
                                            userFilterApplied: true
                                        }));
                                    } else {
                                        // If no user is selected, apply other filters if they exist
                                        let resetFiltered = [...donations];

                                        // Re-apply other filters
                                        if (PersonalInfo.minAmount) {
                                            resetFiltered = resetFiltered.filter(sub =>
                                                parseFloat(sub.amount) >= parseFloat(PersonalInfo.minAmount)
                                            );
                                        }

                                        if (PersonalInfo.maxAmount) {
                                            resetFiltered = resetFiltered.filter(sub =>
                                                parseFloat(sub.amount) <= parseFloat(PersonalInfo.maxAmount)
                                            );
                                        }

                                        // Apply NGO filter if active
                                        if (PersonalInfo.selectedNgo) {
                                            resetFiltered = resetFiltered.filter(
                                                sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                            );
                                        }

                                        const stillFiltered = PersonalInfo.minAmount ||
                                            PersonalInfo.maxAmount ||
                                            PersonalInfo.selectedNgo;

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredDonations: stillFiltered ? resetFiltered : null,
                                            donationsFiltered: !!stillFiltered,
                                            userFilterApplied: false
                                        }));
                                    }
                                }}
                            >
                                Filter
                            </button>
                        </div>
                        {/* Third row */}
                        <div className={styles.filterRow}>
                            Filter by value:
                            <input
                                type="number"
                                placeholder="Min amount"
                                value={PersonalInfo.minAmount || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    minAmount: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <input
                                type="number"
                                placeholder="Max amount"
                                value={PersonalInfo.maxAmount || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    maxAmount: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Always start with the original subscriptions
                                    let filtered = [...donations];

                                    // Apply user filter if it's active
                                    if (PersonalInfo.selectedUser) {
                                        filtered = filtered.filter(
                                            sub => String(sub.user_id) === String(PersonalInfo.selectedUser)
                                        );
                                    }

                                    // Apply NGO filter if it's active
                                    if (PersonalInfo.selectedNgo) {
                                        filtered = filtered.filter(
                                            sub => String(sub.ngo_id) === String(PersonalInfo.selectedNgo)
                                        );
                                    }

                                    // Apply min amount filter if provided
                                    if (PersonalInfo.minAmount) {
                                        const minValue = parseFloat(PersonalInfo.minAmount);
                                        filtered = filtered.filter(sub =>
                                            parseFloat(sub.amount) >= minValue
                                        );
                                    }

                                    // Apply max amount filter if provided
                                    if (PersonalInfo.maxAmount) {
                                        const maxValue = parseFloat(PersonalInfo.maxAmount);
                                        filtered = filtered.filter(sub =>
                                            parseFloat(sub.amount) <= maxValue
                                        );
                                    }

                                    // Determine if any filter is applied
                                    const isAnyFilterApplied = PersonalInfo.selectedUser ||
                                        PersonalInfo.selectedNgo ||
                                        PersonalInfo.minAmount ||
                                        PersonalInfo.maxAmount;

                                    // Update state with filtered data
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        filteredDonations: isAnyFilterApplied ? filtered : null,
                                        donationsFiltered: !!isAnyFilterApplied,
                                        amountFilterApplied: !!(PersonalInfo.minAmount || PersonalInfo.maxAmount)
                                    }));

                                }}
                            >
                                Filter
                            </button>
                        </div>
                        {/* Fourth row */}
                        <div className={styles.filterRow}>
                            <button
                                type="button"
                                className={styles.cleanButton}
                                onClick={() => {
                                    // Reset all filters
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        selectedNgo: '',
                                        minAmount: '',
                                        maxAmount: '',
                                        filteredDonations: null,
                                        donationsFiltered: false,
                                        amountFilterApplied: false
                                    }));
                                }}
                            >
                                Clean filters
                            </button>
                        </div>
                    </div>
                )}

                {/* PENDING VERIFICATIONS */}
                {/* Only show tag input and button when verifications section (index 2) is open */}

                {openSections.includes(2) && (
                    <div className={styles.tagInputContainer}>
                        <h4>Verifications filters</h4>

                    </div>
                )}

                {/* ALL TAGS */}
                {/* Only show tag input and button when tags section (index 3) is open */}
                {openSections.includes(3) && (
                    <div className={styles.tagInputContainer}>
                        <h4>Tags options</h4>
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Enter new tag"
                            className={styles.tagInput}
                        />
                        <button
                            type="button"
                            className={styles.addTagButton}
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                        >
                            Add Tag
                        </button>
                    </div>
                )}

                {/* ALL ACTIONS */}
                {/* Only show tag input and button when actions section (index 4) is open */}

                {openSections.includes(4) && (
                    <div className={styles.tagInputContainer}>
                        <h4>Actions filters</h4>
                        {/* First row */}
                        <div className={styles.filterRow}>
                            Filter by action type:
                            <select
                                value={PersonalInfo.selectedAction || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    selectedAction: e.target.value
                                }))}
                                className={styles.Select}
                            >
                                <option value="">Select action type</option>
                                {/* Create a unique list of action types sorted alphabetically */}
                                {[...new Map(actions.map(action => [action.action_type, action]))
                                    .values()]
                                    .sort((a, b) => String(a.action_type).localeCompare(String(b.action_type)))
                                    .map(action => (
                                        <option key={action.action_type} value={action.action_type}>
                                            {action.action_type}
                                        </option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Log selected value for debugging
                                    console.log("Selected NGO ID:", PersonalInfo.selectedAction);
                                    console.log("All actions:", actions);

                                    if (PersonalInfo.selectedAction) {
                                        // Show only subscriptions for the selected NGO
                                        const filtered = actions.filter(
                                            sub => String(sub.action_type) === String(PersonalInfo.selectedAction)
                                        );

                                        console.log("Filtered actions:", filtered);

                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredActions: filtered,
                                            actionsFiltered: true
                                        }));
                                    } else {
                                        // If no NGO selected or "Select NGO" is chosen, show all
                                        setPersonalInfo(prev => ({
                                            ...prev,
                                            filteredActions: actions,
                                            actionsFiltered: false
                                        }));
                                    }
                                }}
                            >
                                Filter

                            </button>
                        </div>
                        {/* Second row */}

                        {/* Third row */}
                        <div className={styles.filterRow}>
                            Filter by date:
                            <input
                                type="date"
                                placeholder="Begin date"
                                value={PersonalInfo.beginDate || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    beginDate: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <input
                                type="date"
                                placeholder="End date"
                                value={PersonalInfo.endDate || ''}
                                onChange={(e) => setPersonalInfo(prev => ({
                                    ...prev,
                                    endDate: e.target.value
                                }))}
                                className={styles.amountInput}
                            />
                            <button
                                type="button"
                                className={styles.filterButton}
                                onClick={() => {
                                    // Always start with the original actions
                                    let filtered = [...actions];

                                    // Apply action type filter if it's active
                                    if (PersonalInfo.selectedAction) {
                                        filtered = filtered.filter(
                                            sub => String(sub.action_type) === String(PersonalInfo.selectedAction)
                                        );
                                    }

                                    // Apply begin date filter if provided
                                    if (PersonalInfo.beginDate) {
                                        const beginDateObj = new Date(PersonalInfo.beginDate);
                                        filtered = filtered.filter(sub => {
                                            const actionDate = new Date(sub.action_date);
                                            return actionDate >= beginDateObj;
                                        });
                                    }

                                    // Apply end date filter if provided
                                    if (PersonalInfo.endDate) {
                                        const endDateObj = new Date(PersonalInfo.endDate);
                                        // Add one day to include the end date fully
                                        endDateObj.setDate(endDateObj.getDate() + 1);
                                        filtered = filtered.filter(sub => {
                                            const actionDate = new Date(sub.action_date);
                                            return actionDate < endDateObj;
                                        });
                                    }

                                    // Determine if any filter is applied
                                    const isAnyFilterApplied = PersonalInfo.selectedAction ||
                                        PersonalInfo.beginDate ||
                                        PersonalInfo.endDate;

                                    // Update state with filtered data
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        filteredActions: isAnyFilterApplied ? filtered : null,
                                        actionsFiltered: !!isAnyFilterApplied, // Fixed typo: acitonsFiltered → actionsFiltered
                                        dateFilterApplied: !!(PersonalInfo.beginDate || PersonalInfo.endDate) // Changed from amountFilterApplied to dateFilterApplied for clarity
                                    }));
                                }}
                            >
                                Filter
                            </button>
                        </div>

                        {/* Fourth row */}
                        <div className={styles.filterRow}>
                            <button
                                type="button"
                                className={styles.cleanButton}
                                onClick={() => {
                                    // Reset all filters
                                    setPersonalInfo(prev => ({
                                        ...prev,
                                        selectedAction: '',
                                        beginDate: '',
                                        endDate: '',
                                        filteredAction: null,
                                        actionsFiltered: false,
                                        amountFilterApplied: false
                                    }));
                                }}
                            >
                                Clean filters
                            </button>
                        </div>
                    </div>
                )}

            </div>

        );
    };

    return (
        <div className={styles.page}>
            <Header/>
            <div className={styles.profileWrapper}>
                <div className={styles.leftSideBar}>
                    <div className={styles.photoSection}>
                        <img
                            className={styles.profilePic}
                            src={PersonalInfo.image || "ngo_icon.png"}
                            alt="Your image"
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{display: "none"}}
                            accept="image/*"
                        />
                        <button
                            type="button"
                            className={styles.uploadButton}
                            onClick={handlePhotoClick}
                        >
                            Add picture
                        </button>
                    </div>
                    <div className={styles.informationContainer}>
                        {renderPersonalInfo()}
                    </div>


                </div>

                <div className={styles.rightSideBar}>
                    {displayedSections.map((section, index) => {
                        let data = [];

                        if (index === 0) data = PersonalInfo.subscriptionsFiltered ? PersonalInfo.filteredSubscriptions : subscriptions;
                        if (index === 1) data = PersonalInfo.donationsFiltered ? PersonalInfo.filteredDonations : donations;
                        if (index === 2) data = verifications;
                        if (index === 3) data = tags;
                        if (index === 4) data = PersonalInfo.actionsFiltered ? PersonalInfo.filteredActions : actions;

                        return (
                            <div className={styles.accordionSection} key={index}>
                                <div
                                    className={styles.accordionTitle}
                                    onClick={() => toggleSection(index)}
                                >
                                    {section.title}
                                </div>
                                <div
                                    className={`${styles.accordionContent} ${openSections.includes(index) ? styles.open : ""}`}
                                >
                                    <ul>
                                        {data.length > 0 ? (
                                            data.map((item, i) => (
                                                <li key={i}>
                                                    <div>
                                                        <div>
                                                            <strong>{item.ngo_name || item.username || item.name || item.tag || item.action_details + " on " + item.action_date || "Unnamed"}</strong>
                                                        </div>
                                                        {index === 4 && (
                                                            <div>{"NGO (id) affected:" + item.ngo_id}</div>)}

                                                        <div
                                                            style={{
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                color: item.status === 'active' ? 'green' : 'red',
                                                            }}
                                                        >
                                                            {item.status || ""}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span>{item.amount != null ? `${item.amount} €` : ''}</span>
                                                        {index === 4 && (
                                                            <div className={styles.adminDisplay}>
                                                                {<>
                                                                    <div>
                                                                        {"Admin (id): " + item.admin_id}
                                                                    </div>
                                                                    <div>
                                                                        {"Action id: " + item.action_id}
                                                                    </div>
                                                                </>}
                                                            </div>)}
                                                        {/* Only show toggle button in subscriptions (index 0) */}
                                                        {index === 0 && (
                                                            <button className={styles.itemButton}
                                                                    onClick={() => handleStatusChange(item.subscription_id, item.status, item.ngo_id)}
                                                            >
                                                                {item.status === 'active' ? 'Cancel' : 'Activate'}
                                                            </button>
                                                        )}
                                                        {/* Only show report donation in donations (index 1) */}
                                                        {index === 1 && (
                                                            <button className={styles.itemButton}
                                                                    onClick={() => handleReportDonation(item.subscription_id, item.status)}
                                                            >
                                                                {'Report'}
                                                            </button>
                                                        )}
                                                        {/* Only show redirect to verification (index 2) */}
                                                        {index === 2 && (
                                                            <button className={styles.itemButton}
                                                                    onClick={() => handleRedirectVerification(item.ngo_id)}
                                                            >
                                                                {'To verification'}
                                                            </button>
                                                        )}
                                                        {/* Only show remove tag to verification (index 3) */}
                                                        {index === 3 && (
                                                            <button className={styles.itemButton}
                                                                    onClick={() => handleRemoveTag(item.tag_id, item.tag)}
                                                            >
                                                                {'Remove'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <li>Nothing yet</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <footer></footer>

        </div>
    )
}

export default Admin;
