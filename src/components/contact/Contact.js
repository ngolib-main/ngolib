import React, { useState } from 'react';
import styles from '../../style/page/contact.module.css';
import Header from '../reusable/Header';

function Contact() {
    const [formData, setFormData] = useState({
        recipient: 'Admin',
        issue: 'General Question',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitted Contact Request:', formData);
        // Log the admin action if you want to track this
        try {
            await fetch('/api/contact/form', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    to: formData.recipient,
                    subject: formData.issue,
                    message: formData.message,
                })
            });

        } catch (actionErr) {
            console.error('Error logging admin action:', actionErr);
            // Not alerting the user about this error since the main operation succeeded
        }
        // TODO: send data to your backend (fetch / axios)
    };

    return (
        <>
            <Header />
            <div className={styles.contactPage}>
                <h1>Contact Us</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="recipient">Who do you want to contact?</label>
                    <select
                        id="recipient"
                        name="recipient"
                        value={formData.recipient}
                        onChange={handleChange}
                    >
                        <option value="Admin">Admin</option>
                        <option value="Authorities">Authorities</option>
                    </select>

                    <label htmlFor="issue">What is the issue about?</label>
                    <select
                        id="issue"
                        name="issue"
                        value={formData.issue}
                        onChange={handleChange}
                    >
                        <option value="General Question">General Question</option>
                        <option value="Donation Inquiry">Donation Inquiry</option>
                        <option value="Technical Issue">Technical Issue</option>
                    </select>

                    <label htmlFor="message">Message:</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">Send Message</button>
                </form>
            </div>
        </>
    );
}

export default Contact;


