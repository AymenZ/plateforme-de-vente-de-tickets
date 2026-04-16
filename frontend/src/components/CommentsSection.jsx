import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaSort, FaReply, FaThumbsUp } from 'react-icons/fa';
import '../styles/CommentsSection.css';

function CommentsSection() {
  // Données fictives
  const mockCommentsData = [
    { id: 1, author: "Alice", rating: 4, text: "Super événement ! Vraiment très bien organisé et beaucoup de choses intéressantes à découvrir.", date: "2025-03-10", likes: 2, replies: [] },
    { id: 2, author: "Bob", rating: 5, text: "Incroyable, je recommande.", date: "2025-03-11", likes: 5, replies: [] },
    { id: 3, author: "Marie", rating: 5, text: "Excellente organisation, à bientôt ! J'ai adoré chaque moment, et les ateliers étaient top.", date: "2025-03-12", likes: 3, replies: [] },
    { id: 4, author: "Jean", rating: 3, text: "Bien, mais aurait pu être mieux. Quelques points à améliorer.", date: "2025-03-13", likes: 1, replies: [] }
  ];

  const { isAuthenticated, user } = useAuth();

  // États du formulaire
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(mockCommentsData);
  const [sortNewest, setSortNewest] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [likedComments, setLikedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [publishedCommentId, setPublishedCommentId] = useState(null);
  const [publishedReplyId, setPublishedReplyId] = useState(null);

  // Rendu des étoiles
  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (interactive ? hoverRating || rating : ratingValue) ? 'filled' : 'empty'}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <FaStar />
          </span>
        ))}
      </div>
    );
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    const newComment = {
      id: comments.length + 1,
      author: user?.email?.split('@')[0] || "Utilisateur",
      rating,
      text: comment,
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      replies: []
    };
    setComments([newComment, ...comments]);
    setPublishedCommentId(newComment.id);
    
    // Réinitialiser après 1 seconde
    setTimeout(() => {
      setPublishedCommentId(null);
    }, 1000);
    
    setRating(0);
    setComment('');
  };

  const toggleSort = () => setSortNewest(!sortNewest);

  const toggleExpand = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLike = (id) => {
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        setComments(comments.map(c => c.id === id ? { ...c, likes: Math.max(0, c.likes - 1) } : c));
      } else {
        newSet.add(id);
        setComments(comments.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
      }
      return newSet;
    });
  };

  const handleReply = (id) => {
    setReplyingTo(replyingTo === id ? null : id);
    if (!replyTexts[id]) {
      setReplyTexts((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmitReply = (id) => {
    const replyText = replyTexts[id]?.trim();
    if (replyText) {
      const newReply = {
        id: Math.random().toString(36).substr(2, 9),
        author: user?.email?.split('@')[0] || "Utilisateur",
        text: replyText,
        date: new Date().toISOString().split('T')[0],
        likes: 0
      };
      
      // Ajouter la réponse au commentaire
      setComments(comments.map(c => 
        c.id === id ? { ...c, replies: [...(c.replies || []), newReply] } : c
      ));
      
      setPublishedReplyId(id);
      
      // Réinitialiser après 1 seconde
      setTimeout(() => {
        setPublishedReplyId(null);
      }, 1000);
      
      setReplyTexts((prev) => ({ ...prev, [id]: '' }));
      setReplyingTo(null);
    }
  };

  const sortedComments = [...comments].sort((a, b) =>
    sortNewest ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );

  return (
    <section className="comments-section">
      <h2>Commentaires et Avis</h2>

      {/* Tri */}
      <div className="sort-comments" onClick={toggleSort}>
        <FaSort /> Trier par {sortNewest ? "les plus récents" : "les plus anciens"}
      </div>

      {/* Section formulaire (si connecté) */}
      {isAuthenticated() ? (
        <div className="comment-form-container">
          <h3>Partager votre avis</h3>
          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="form-group">
              <label>Votre note :</label>
              {renderStars(rating, true)}
              <small className="rating-text">
                {rating > 0 ? `${rating} ${rating === 1 ? 'étoile' : 'étoiles'}` : 'Cliquez pour noter'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Votre commentaire :</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows="4"
                className="comment-textarea"
              />
            </div>

            <button 
              type="submit" 
              className={`btn-publish ${(rating && comment.trim()) ? 'active' : ''} ${publishedCommentId ? 'published' : ''}`}
              disabled={!rating || !comment.trim()}
            >
              {publishedCommentId ? '✓ Publié' : 'Publier'}
            </button>
          </form>
        </div>
      ) : (
        <div className="login-prompt">
          <p>Connectez-vous pour commenter et partager votre avis</p>
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="comments-list">
        <h3>Avis des utilisateurs ({comments.length})</h3>
        {sortedComments.length > 0 ? (
          sortedComments.map((c) => {
            const isExpanded = expandedComments[c.id];
            const shortText = c.text.length > 100 ? c.text.slice(0, 100) + '...' : c.text;
            return (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author-info">
                    <span className="comment-author">{c.author}</span>
                    {renderStars(c.rating)}
                  </div>
                  <span className="comment-date">{c.date}</span>
                </div>
                <p className="comment-text">
                  {isExpanded ? c.text : shortText}
                  {c.text.length > 100 && (
                    <span className="expand-text" onClick={() => toggleExpand(c.id)}>
                      {isExpanded ? ' Show Less' : ' More'}
                    </span>
                  )}
                </p>
                <div className="comment-actions">
                  <span 
                    className={`like-btn ${likedComments.has(c.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(c.id)}
                  >
                    <FaThumbsUp /> {c.likes}
                  </span>
                  <span 
                    className={`reply-btn ${replyingTo === c.id ? 'active' : ''}`}
                    onClick={() => handleReply(c.id)}
                  >
                    <FaReply /> Reply
                  </span>
                </div>

                {replyingTo === c.id && (
                  <div className="reply-form">
                    <textarea
                      value={replyTexts[c.id] || ''}
                      onChange={(e) => setReplyTexts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="Répondre à ce commentaire..."
                      rows="2"
                      className="reply-textarea"
                    />
                    <div className="reply-actions">
                      <button 
                        className={`btn-reply-submit ${publishedReplyId === c.id ? 'published' : ''}`}
                        onClick={() => handleSubmitReply(c.id)}
                        disabled={!replyTexts[c.id]?.trim()}
                      >
                        {publishedReplyId === c.id ? '✓ Répondu' : 'Répondre'}
                      </button>
                      <button 
                        className="btn-reply-cancel"
                        onClick={() => setReplyingTo(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* REPLIES LIST */}
                {c.replies && c.replies.length > 0 && (
                  <div className="replies-list">
                    {c.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <div className="reply-header">
                          <span className="reply-author">{reply.author}</span>
                          <span className="reply-date">{reply.date}</span>
                        </div>
                        <p className="reply-text">{reply.text}</p>
                        <div className="reply-footer">
                          <span className="reply-like">
                            <FaThumbsUp /> {reply.likes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="no-comments">Aucun avis pour le moment. Soyez le premier à commenter !</p>
        )}
      </div>
    </section>
  );
}

export default CommentsSection;