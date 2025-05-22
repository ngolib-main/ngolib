/*
 *  There are 2 base tabs: Donate and Home
 *  Plus another two conditional ones based on the cookie from /api/auth/me
 *  If a user is logged in, then two extra tabs are displayed:
 *  Profile and Log out
 *  Depending on the user type ("user", "NGO" or "admin") the Profile link redirects to
 *  different kind of progile pages.
 */

import * as React from 'react';
import {useState, useEffect} from "react";
// TODO: Third: Depends on outcome of Second. To delete or not to delete (the below line)?
import { useNavigate } from "react-router-dom";
import headerStyle from "../../style/reusable/header.module.css"
import Sidebar from "./Sidebar";

function Header() {

    // Retrieve any cookie data after/if the user is logged in.
    const [user, setUser] = useState(null);
    // TODO: Second: Depends on outcome of First. To delete or not to delete (the below line)?
    const navigate = useNavigate();

    // Retrieves the cookie to check whether there is any user logged in.
    useEffect(() => {
        fetch("/api/auth/me", {
            credentials: "include"
        })
            .then(res => res.ok ? res.json() : Promise.reject("Not logged in"))
            .then(data => setUser(data))
            .catch(err => {
                console.log("User not logged in:", err);
            });
    }, []);

    // Function lo Logout.
    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });
            setUser(null);
            // TODO: First: What to do after logging out? Redirect to Login or stay in the current page?
            navigate("/home"); // Redirect to login or homepage
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    // Decide profile path based on user type
    let profileTab;
    if (!user) {
        profileTab = { label: 'Log In', path: '/login' };
    } else {
        let path = '/home';
        if (user.type === 'NGO') path = '/profile';
        else if (user.type === 'user') path = '/user';
        else if (user.type === 'admin') path = '/admin';
        profileTab = { label: 'Profile', path };
    }

    // Base tabs
    const tabs = [
        { label: 'Donate', path: '/search' },
        { label: 'Home', path: '/home' },
        profileTab
    ];

    // If user is logged in, add logout as a clickable tab
    if (user) {
        tabs.push({
            label: 'Log out',
            action: handleLogout // Sidebar must support actions (see note below)
        });
    }

    return (
        <div className={headerStyle.header}>
            <div className={headerStyle["header-content"]}>
                <img
                    src="/logo.png"
                    alt="Charity logo"
                    className={headerStyle["logo-image"]}
                />
                <h1 className={headerStyle["header-title"]}>NGOLib</h1>
                <Sidebar tabs={tabs}>
                    {user && (
                        <div className={headerStyle["header-user"]}>
                            Hello, {user.name || user.email}
                        </div>
                    )}
                </Sidebar>
            </div>
        </div>
    )
}

export default Header;