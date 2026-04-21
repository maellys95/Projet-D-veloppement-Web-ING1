function NewsCard({ image, category, date, title, description, categoryClass }) {
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

export default NewsCard;