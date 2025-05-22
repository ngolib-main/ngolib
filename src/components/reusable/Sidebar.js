
// TODO: Consider removing the below import line since the related const [tabs_def, setTabs] can be also removed
// import React, {useState} from 'react';
import {NavLink} from 'react-router-dom';
import style from "../../style/reusable/sidebar.module.css";

function Sidebar({tabs}) {
    // TODO: Consider removing the below commented code, is does nothing I believe.

    return (
        <nav className= {style.sidebar}>
            <ul>
                {tabs.map((tab, index) => (
                    <li key={index}>
                        <NavLink
                            to={tab.path || "#"}
                            // Logout function with confirmation prompt
                            onClick={(e) => {
                                if (tab.action) {
                                    e.preventDefault();  // Stop navigation
                                    const confirmed = window.confirm("Are you sure you want to log out?");
                                    if (confirmed) {
                                        tab.action();    // Run the action only if confirmed
                                    }
                                }
                            }}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                        >
                            {tab.label}
                        </NavLink>


                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Sidebar;
