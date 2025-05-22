import React from 'react';
import homeStyle from '../../style/page/home.module.css';
import Header from "../reusable/Header";
import HomeTile from "./HomeTile";
import Footer from "../reusable/Footer";

function Home() {
    return (
        <div className={homeStyle.homepage}>
            <Header></Header>
            <div className={homeStyle["homepage-content"]}>
                <HomeTile title="Charity Webpage"
                          text="We are dedicated to making a difference."
                          image="homepage_main_image.png"
                          order={1}                         ></HomeTile>
                <HomeTile title="Help children"
                          text="Help children get proper education"
                          image="charity2.jpg"
                          order={0}                         ></HomeTile>
                <HomeTile title="Charity"
                          text="Help adults get proper education"
                          image="charity1.jpg"
                          order={1}                         ></HomeTile>
            </div>
            <Footer></Footer>
        </div>
    );
}

export default Home;
