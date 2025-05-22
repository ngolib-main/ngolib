import * as React from 'react';
import {useState, useEffect} from "react";
import headerStyle from "../../style/reusable/header.module.css"
import Sidebar from "./Sidebar";

function Header() {

    // Retrieve any cookie data after/if the user is logged in.
    const [user, setUser] = useState(null);

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

    const tabs = [
        { label: 'Donate', path: '/search' },
        { label: 'Home', path: '/home' },
        profileTab
    ];

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