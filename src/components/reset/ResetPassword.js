import * as React from 'react';
import {useEffect, useState} from "react";
import "../../style/page/userForms.css";
import "../../style/reusable/toggle.css";
import Header from "../reusable/Header";
import {useSearchParams, useNavigate} from "react-router-dom"; // Assuming you place the toggle styles here

function ResetPassword(){
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password_rep, setPasswordRep] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleSearchEmail = async (token) => {
        try {
            const response = await fetch('/api/auth/find-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to validate token');
                alert(error)
            }

            const data = await response.json();
            // Now data should contain user_id and email from the backend
            return {
                userId: data.user_id,
                email: data.email
            };
        } catch (error) {
            console.error('Error finding user by token:', error);
           // alert(error);
            //navigate('/forgot');
            throw error; // Re-throw to handle in the component
        }
    };

    useEffect(() => {
        // Function to be executed on page load
        const validateToken = async () => {
            if (!token) {
                setError('No reset token provided');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const userData = await handleSearchEmail(token);
                setUserId(userData.userId);
                //console.log(userData);
                //console.log("This is the user id:")
                //console.log(userId);
                setEmail(userData.email);
            } catch (error) {
                alert('Invalid or expired token \nYou will be redirected to the Forgot Password page.');
                navigate('/forgot');
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []); // Empty dependency array means this runs once on mount



    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Updating password...");

        try {
            console.log("⚡ Sending request...");

            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({userId, password:password, password_rep:password_rep}),
            })

            console.log("Response Status:", response.status);

            console.log("Response OK:", response.ok);
            const data = await response.json();

            if (response.ok) {
                console.log("Response Data:", data); // Log the response body
                setMessage(`✅ Success: ${data.message}`); // Display success message
            } else {
                console.log("Response Data:", data); // Log the response body
                setMessage(`❌ Error: ${data.message || "Unknown error occurred"}`); // Handle server error
            }

        } catch (error) {
            console.error("Signup Error:", error);
            setMessage(`❌ Error: ${error.message}`);
            // Ensure React updates the UI by wrapping setMessage in a useEffect trigger
            setTimeout(() => {
                setMessage(`❌ Error: ${error.message}`);
            }, 0);
            alert(`Error: ${error.message}`);  // Alert popup
        }
    };


    return (
        <div className={"outerContainer"}>
            <Header />
            <div className="formComponent">
                <h3>Reset account password</h3>
                <form onSubmit={handleSubmit} className="userForm">

                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        placeholder="Email"
                        required
                        readOnly
                        onInput={(e => setEmail(e.target.value))}
                    />
                    <input
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        placeholder="Password"
                        required
                        onInput={(e => setPassword(e.target.value))}
                    />
                    <input
                        type="password"
                        name="password_rep"
                        id="password_rep"
                        value={password_rep}
                        placeholder="Repeat password"
                        required
                        onInput={(e => setPasswordRep(e.target.value))}
                    />

                  <input type="submit" value="Reset Password"/>
                </form>
                {message && <p>{message}</p>} {/* Show the message */}
                <a href="/login">Log in</a>
            </div>
        </div>
    )
}

export default ResetPassword;