import React, { useState, useEffect } from 'react';
import styles from '../../style/page/volunteer.module.css';
import Header from '../reusable/Header';
import Footer from '../reusable/Footer';

function Volunteer() {
    const [volunteerJobs, setVolunteerJobs] = useState([]);

    useEffect(() => {
        // Replace this with an actual API call
        setVolunteerJobs([
            { id: 1, title: 'Teach Kids', description: 'Help underprivileged children learn.', location: 'New York, USA' },
            { id: 2, title: 'Food Distribution', description: 'Distribute food to the homeless.', location: 'Los Angeles, USA' },
            { id: 3, title: 'Beach Cleanup', description: 'Join us in cleaning the beach.', location: 'Miami, USA' },
        ]);
    }, []);

    return (
        <>
            <Header />

            <div className={styles.volunteerPage}>
                <h1>Volunteer Opportunities</h1>
                <p>Find volunteering jobs and make a difference!</p>

                <div className={styles.volunteerList}>
                    {volunteerJobs.map(job => (
                        <div key={job.id} className={styles.volunteerCard}>
                            <h2>{job.title}</h2>
                            <p>{job.description}</p>
                            <p><strong>Location:</strong> {job.location}</p>
                            <button className={styles.applyBtn}>Apply Now</button>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Volunteer;

