export default function NewsCard({
                                     image,
                                     category,
                                     categoryClass,
                                     date,
                                     title,
                                     description,
                                 }) {
    return (
        <article className="news-card">
            <img src={image} alt={title} className="news-image" />

            <div className="news-content">
                <div className="news-top">
                    <span className={`news-category ${categoryClass}`}>{category}</span>
                    <span className="news-date">{date}</span>
                </div>

                <h3>{title}</h3>
                <p>{description}</p>

                <a href="#" className="read-more">
                    Lire la suite →
                </a>
            </div>
        </article>
    );
}