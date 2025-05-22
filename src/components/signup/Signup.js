import * as React from 'react';
import {useState} from "react";
import "../../style/page/userForms.css";
import "../../style/reusable/toggle.css";
import Header from "../reusable/Header"; // Assuming you place the toggle styles here

function Signup(){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password_rep, setPasswordRep] = useState("");
    const [isNGO, setIsNGO] = useState(false);
    const [ngoName, setNGOName] = useState("");
    const [ngoEmail, setNGOEmail] = useState("");
    const [ngoWebsite, setNGOWebsite] = useState("");
    const [ngoPhone, setNGOPhone] = useState("");
    const [ngoDescription, setNGODescription] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Signing up...");

        try {
            console.log("⚡ Sending request...");

            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, password_rep, isNGO, ngoName, ngoEmail, ngoWebsite, ngoPhone, ngoDescription }),
            })

            console.log("Response Status:", response.status);
            console.log("Response OK:", response.ok);
            const data = await response.json();

            if (response.ok) {
                console.log("Response Data:", data); // Log the response body
                setMessage(`✅ Success: ${data.message}`); // Display success message
                // Send verification link
            } else {
                console.log("Response Data:", data); // Log the response body
                setMessage(`❌ Error: ${data.message || "Unknown error occurred"}`); // Handle server error
            }

        } catch (error) {
            console.error("❌ Signup Error:", error);
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
                        <h3>Create account</h3>
                        <form onSubmit={handleSubmit} className="userForm">
                            {/* Toggle Switch for isNGO */}
                            <div className="toggle-container">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={isNGO}
                                        onChange={(e) => setIsNGO(e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                    <span className="switch-label">I am an NGO</span>
                                </label>
                            </div>

                            <input
                                type="username"
                                name="username"
                                id="username"
                                value={username}
                                placeholder="User name (optional)"
                                required={false}
                                onInput={(e => setUsername(e.target.value))}
                            />
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                placeholder="Email"
                                required
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

                            {/* Conditionally render NGO fields */}
                            {isNGO && (
                                <>
                                    <input
                                        type="text"
                                        name="ngoName"
                                        id="ngoName"
                                        value={ngoName}
                                        placeholder="NGO Name (optional)"
                                        required
                                        onInput={(e) => setNGOName(e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        name="ngoEmail"
                                        id="ngoEmail"
                                        value={ngoEmail}
                                        placeholder="NGO Email (optional)"
                                        required
                                        onInput={(e) => setNGOEmail(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        name="ngoWebsite"
                                        id="ngoWebsite"
                                        value={ngoWebsite}
                                        placeholder="NGO Website (optional)"
                                        required
                                        onInput={(e) => setNGOWebsite(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        name="ngoPhone"
                                        id="ngoPhone"
                                        value={ngoPhone}
                                        placeholder="NGO Phone number (optional)"
                                        required
                                        onInput={(e) => setNGOPhone(e.target.value)}
                                    />
                                    <textarea
                                        type="ngoDescription"
                                        name="ngoDescription"
                                        id="ngoDescription"
                                        value={ngoDescription}
                                        placeholder="Describe your NGO (optional)"
                                        onChange={(e) => {
                                            setNGODescription(e.target.value);
                                            e.target.style.height = "auto"; // Reset height
                                            e.target.style.height = e.target.scrollHeight + "px"; // Set to new scroll height
                                        }}
                                        rows={2} // Optional starting height
                                        style={{ overflow: "hidden" }} // Hide scrollba
                                        required
                                        onInput={(e) => setNGODescription(e.target.value)}
                                    />
                                </>

                            )}

                            <input type="submit" value="Sign Up"/>
                        </form>
                        {message && <p>{message}</p>} {/* Show the message */}
                        <a href="/login">Log in</a>
                    </div>
        </div>
    )
}

export default Signup;