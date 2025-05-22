// --- index.js ---
// Entry point for the React Application
// Not part of the View in MVC, but supports it. It does not really display components,
// but rather is responsible for how the view later is connected. Kinda the front door.
// The actual View part is all contained in src/components

import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './style/index.css';
import reportWebVitals from './reportWebVitals';
// Import protected routes for unauthorised access to pages
import ProtectedRoute from "./components/reusable/ProtectedRoute";
// Import all pages here
import Login from "./components/login/Login";
import Signup from "./components/signup/Signup";
import Home from "./components/home/Home";
import NGOinfo from "./components/ngoInfo/NGOinfo";
import Search from "./components/search/Search";
import Header from "./components/reusable/Header";
import Volunteer from "./components/volunteer/Volunteer";
import PostVolunteer from "./components/post_volunteer/PostVolunteer";
import VerifyNGOs from "./components/verify/VerifyNGOs";
import Contact from "./components/contact/Contact";
import Admin from "./components/account/Admin";
import Profile from "./components/profile/Profile";
import ForgotPassword from "./components/forgot/ForgotPassword";
import Donate from "./components/donate/donate";
import ResetPassword from "./components/reset/ResetPassword";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <BrowserRouter>
        <Routes>
            <Route path="" element={<Home/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/signup" element={<Signup/>}/>
            <Route path="/search" element={<Search/>}/>
            <Route path="/header" element={<Header/>}/>
            <Route path="/home" element={<Home/>}/>
            <Route path="/volunteer" element={<Volunteer/>}/>
            <Route path="/post-volunteer" element={<PostVolunteer/>}/>
            <Route path="/admin/verify-ngos" element={<VerifyNGOs/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="/payment/:id" element={<Donate/>}/>
            <Route path="/ngos/:id" element={<NGOinfo/>}/>
            <Route path="/profile" element={ <ProtectedRoute allowedRoles={["NGO"]}> <Profile /> </ProtectedRoute> } />
            <Route path="/admin" element={ <ProtectedRoute allowedRoles={["admin"]}> <Admin /> </ProtectedRoute> } />
            <Route path="/user" element={ <ProtectedRoute allowedRoles={["user"]}> <Profile /> </ProtectedRoute> } />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword/>} />
        </Routes>
    </BrowserRouter>
);

reportWebVitals();
