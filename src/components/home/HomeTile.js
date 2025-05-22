import * as React from 'react';
import homeTileStyle from "../../style/components/hometile.module.css";

function HomeTile({title, text, image, order}) {

    return (
        <div className={homeTileStyle.homeTile}>
            <div className={homeTileStyle["homeTile-content"]}>
                {order === 0 ? (
                <>
                    <img
                        src={image}
                        alt={title}
                        className={homeTileStyle["homeTile-image"]}
                    />
                    <div className={homeTileStyle["homeTile-textBlock"]}>
                        <h1 className={homeTileStyle["homeTile-title"]}>{title}</h1>
                        <p className={homeTileStyle["homeTile-text"]}>{text}</p>
                    </div>
                </>
                    ) : (
                <>
                    <div className={homeTileStyle["homeTile-textBlock"]}>
                        <h1 className={homeTileStyle["homeTile-title"]}>{title}</h1>
                        <p className={homeTileStyle["homeTile-text"]}>{text}</p>
                    </div>
                    <img
                        src={image}
                        alt={title}
                        className={homeTileStyle["homeTile-image"]}
                    />
                </>
                )}
            </div>
        </div>
    );

}

export default HomeTile;
