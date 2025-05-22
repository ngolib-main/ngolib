/*
 * -- Forgot password page --
 *
 *
 */

import React, { useState } from 'react';
import Header from "../reusable/Header";
import "../../style/page/userForms.css";


const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch("/api/auth/forgot-password", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (res.ok) {
            setMessage('Recovery instructions sent to your email.');
        } else {
            setMessage(data.message || 'Something went wrong.');
        }
    };

    return (
        <div className={"outerContainer"}>
            <Header></Header>
                <div className="formComponent">
                    <h3>Forgot Password</h3>
                    <form onSubmit={handleSubmit} className={"userForm"}>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input type="submit" value="Send Recovery Email" />
                    </form>
                    {message && <p>{message}</p>}
                    <a href="/login">Log in</a>
                </div>
        </div>
    );
};

export default ForgotPassword;
