import React, { useState } from 'react';
import styles from '../../style/page/donate.module.css';
import {useParams} from "react-router-dom";
import Header from '../reusable/Header';

const Donate = () => {
    const { id: ngo_id } = useParams();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [amount, setAmount] = useState('50');
    const [status, setStatus] = useState('');
    const handlePayment = async (e) => {

        e.preventDefault();
        if (
            !cardNumber || cardNumber.replace(/\s/g, '').length !== 16 ||
            !expiry || !isValidExpiry(expiry) ||
            !cvv || cvv.length !== 3 ||
            !amount || parseFloat(amount) < 1
        ) {
            setStatus('Please fill all fields correctly');
            return;
        }

        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ngo_id: parseInt(ngo_id),
                    amount: parseFloat(amount),
                }),
            });

            console.log('fetch /api/payment status:', response.status);
            const text = await response.text();
            console.log('fetch /api/payment body:', text);

            if (response.ok) {
                setStatus('Donation successfully sent');
            } else {
                setStatus('Something went wrong, make sure you are logged in');
            }
        } catch (error) {
            console.error(error);
            setStatus('Something went wrong, try again later');
        }
    };

    return (
        <div className={styles.page}>
            <Header />
        <div className={styles.container}>
            <h2>Payment</h2>
            <form onSubmit={handlePayment} className={styles.form}>
                <label className={styles.label}>
                    Card Number:
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                            setStatus('');
                            const rawValue = e.target.value.replace(/\D/g, "");
                            const formatted = rawValue
                                .match(/.{1,4}/g)
                                ?.join(" ")
                                .trim() || "";
                            setCardNumber(formatted);
                        }}
                        placeholder="1234 5678 9012 3456"
                        className={styles.input}
                        maxLength={19}
                    />

                </label>
                <label className={styles.label}>
                    Card Expiration:
                    <input
                        type="text"
                        value={expiry}
                        onChange={(e) => {
                            setStatus('');
                            let input = e.target.value.replace(/\D/g, '');
                            if (input.length >= 3) {
                                input = input.slice(0, 2) + '/' + input.slice(2, 4);
                            }
                            setExpiry(input);
                        }}
                        placeholder="MM/YY"
                        className={styles.input}
                        maxLength={5}
                    />

                </label>
                <label className={styles.label}>
                    Security Code:
                    <input
                        type="password"
                        value={cvv}
                        onChange={(e) => {
                            setStatus('');
                            setCvv(e.target.value);}
                        }
                        placeholder="123"
                        className={styles.input}
                        maxLength="3"
                    />
                </label>
                <label className={styles.label}>
                    Amount, €:
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                            setStatus('');
                            setAmount(e.target.value);}
                        }
                        className={styles.input}
                        min="1"
                        required
                    />
                </label>
                <button type="submit" className={styles.button}>Proceed</button>
            </form>
            {status && <p className={styles.status}>{status}</p>}
        </div>
        </div>
    );
};

const isValidExpiry = (expiry) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [monthStr, yearStr] = expiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt('20' + yearStr, 10); // convert "25" → 2025

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const expiryDate = new Date(year, month); // first day of the next month

    return expiryDate > now;
};

export default Donate;
