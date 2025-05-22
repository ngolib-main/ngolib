import * as React from 'react';
import st from "../../style/reusable/footer.module.css"
import Sidebar from "./Sidebar";

function Footer() {

    const tabs = [
        {label: 'Contact', path: '/contact'},
    ];

    return (
        <div className={st.footer}>
            <div className={st.footer_content}>
                <h1 className={st.footer_title}>@ 2025 NGOLib Inc</h1>
                <Sidebar tabs={tabs}> </Sidebar>
            </div>
        </div>
    )
}

export default Footer;