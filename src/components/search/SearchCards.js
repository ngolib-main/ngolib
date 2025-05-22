import React from 'react';
import style from "../../style/components/searchcard.module.css"
import {useNavigate} from "react-router-dom";

const Tags = ({ tags }) =>
    tags.map(tag => (
        <span key={tag} className={style.tag}>
      {tag}
    </span>
    ));

export const NGOCard = ({ngo}) => {
    const { ngo_id, name, tags, description } = ngo;

    const navigate = useNavigate();
    const viewNGO = () => {
        navigate(`/ngos/${ngo_id}`);
    }

    return (    // below give both class of card and ngo to overwrite palette, ngo is later so cascades later and overwrites
        <article className={`${style.card} ${style.ngo}`}>
            <h3 className={style.title}>{name}</h3>

            <div className={style.desc}>
                <p className={style.descText}>{description}</p>
            </div>

            {/* location slot filled by empty div to keep grid */}
            <div className={style.location} />

            <div className={style.category}>
                <Tags tags={tags} />
            </div>

            <button className={style.action} onClick={viewNGO}>View</button>
        </article>
    );
}

export const OpportunityCard = ({opp, onOpenModal }) => {       // TODO possibly in the future fetch the ngo name in a join
    const {title, tags, description, location} = opp;

    return (
        <article className={`${style.card} ${style.opportunity}`}>
            <h3 className={style.title}>{title}</h3>

            <div className={style.desc}>
                <p className={style.descText}>{description}</p>
            </div>

            <div className={style.location}>{location}</div>

            <div className={style.category}>
                <Tags tags={tags} />
            </div>

            <button className={style.action} onClick={() => onOpenModal(opp)}>Apply</button>
        </article>
    );
}