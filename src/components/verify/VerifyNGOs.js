import React, { useEffect, useState } from 'react';
import styles from '../../style/page/verifyNGOs.module.css';
import Header from '../reusable/Header';
import Footer from '../reusable/Footer';

function VerifyNGOs() {
    const [ngos, setNgos] = useState([]);
    const [openDetailsId, setOpenDetailsId] = useState(null);

    useEffect(() => {
        fetch('/api/admin/pending-ngos') // update endpoint as needed
            .then(res => res.json())
            .then(data => setNgos(data))
            .catch(err => console.error('Error fetching NGOs:', err));
    }, []);

    const handleApprove = id => {
        fetch(`/api/admin/approve-ngo/${id}`, { method: 'POST' })
            .then(() => setNgos(prev => prev.filter(n => n.id !== id)))
            .catch(err => console.error('Error approving NGO:', err));
    };

    const handleReject = id => {
        fetch(`/api/admin/reject-ngo/${id}`, { method: 'POST' })
            .then(() => setNgos(prev => prev.filter(n => n.id !== id)))
            .catch(err => console.error('Error rejecting NGO:', err));
    };

    const toggleDetails = id => {
        setOpenDetailsId(openDetailsId === id ? null : id);
    };

    return (
        <>
            <Header />

            <div className={styles.verifyNgos}>
                <h1>NGO Verification Panel</h1>

                {/* Static checklist always visible */}
                <div className={styles.staticChecklist}>
                    <h2>Verification Checklist</h2>
                    <ul className={styles.checklist}>
                        <li>Official Registration (e.g., certificate/link)</li>
                        <li>Tax-Exempt Status</li>
                        <li>Website &amp; Online Presence</li>
                        <li>Impact Reports (annual report)</li>
                        <li>Bank Details</li>
                        <li>Leadership Info (board members)</li>
                        <li>Fundraising Practices</li>
                    </ul>
                </div>

                {ngos.length === 0 ? (
                    <p>No NGOs pending verification.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Reg. Number</th>
                            <th>Contact</th>
                            <th>Checks</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {ngos.map(ngo => (
                            <React.Fragment key={ngo.id}>
                                <tr>
                                    <td>{ngo.name}</td>
                                    <td>{ngo.registration_number}</td>
                                    <td>{ngo.contact_email}</td>
                                    <td>
                                        <button
                                            className={styles.detailsBtn}
                                            onClick={() => toggleDetails(ngo.id)}
                                        >
                                            {openDetailsId === ngo.id ? 'Hide Checklist' : 'Show Checklist'}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.approve}
                                            onClick={() => handleApprove(ngo.id)}
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            className={styles.reject}
                                            onClick={() => handleReject(ngo.id)}
                                        >
                                            ❌ Reject
                                        </button>
                                    </td>
                                </tr>

                                {openDetailsId === ngo.id && (
                                    <tr className={styles.checklistRow}>
                                        <td colSpan={5}>
                                            <ul className={styles.checklist}>
                                                <li><strong>Official Registration:</strong> {ngo.registration_certificate_url ? <a href={ngo.registration_certificate_url} target="_blank" rel="noopener noreferrer">View Document</a> : 'Missing'}</li>
                                                <li><strong>Tax-Exempt Status:</strong> {ngo.tax_exempt_status ? ngo.tax_exempt_status : 'Missing'}</li>
                                                <li><strong>Website &amp; Online Presence:</strong> {ngo.website_url ? <a href={ngo.website_url} target="_blank" rel="noopener noreferrer">Website</a> : 'Missing'}</li>
                                                <li><strong>Impact Reports:</strong> {ngo.annual_report_url ? <a href={ngo.annual_report_url} target="_blank" rel="noopener noreferrer">Download Report</a> : 'Missing'}</li>
                                                <li><strong>Bank Details:</strong> {ngo.bank_account_type ? ngo.bank_account_type : 'Missing'}</li>
                                                <li><strong>Leadership Info:</strong> {ngo.board_members && ngo.board_members.length > 0 ? ngo.board_members.join(', ') : 'Missing'}</li>
                                                <li><strong>Fundraising Practices:</strong> {ngo.fundraising_tactics ? ngo.fundraising_tactics : 'Review needed'}</li>
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

export default VerifyNGOs;
