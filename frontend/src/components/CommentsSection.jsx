import React, { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaCommentDots,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaExclamationCircle,
  FaSpinner,
  FaStar,
  FaTrash,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { commentsAPI } from '../services/api';
import '../styles/CommentsSection.css';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'highest', label: 'Mieux notés' },
  { value: 'lowest', label: 'Moins bien notés' },
];

const RATING_LABELS = {
  1: 'Très décevant',
  2: 'Peut mieux faire',
  3: 'Correct',
  4: 'Très bien',
  5: 'Excellent',
};

function formatDate(value) {
  if (!value) return 'Date inconnue';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function getDisplayName(email) {
  if (!email || !email.includes('@')) return 'Utilisateur';
  return email.split('@')[0];
}

function getInitials(email) {
  const displayName = getDisplayName(email).replace(/[^a-zA-Z0-9]/g, ' ').trim();
  if (!displayName) return 'U';
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function StarRating({
  value,
  hoverValue = 0,
  onSelect,
  onHover,
  onLeave,
  interactive = false,
  size = 'md',
}) {
  const effectiveValue = interactive ? hoverValue || value : Math.round(value);

  return (
    <div className={`comments-stars comments-stars-${size}`}>
      {[1, 2, 3, 4, 5].map((starValue) => {
        const filled = starValue <= effectiveValue;

        if (!interactive) {
          return (
            <span key={starValue} className={`star-icon ${filled ? 'filled' : ''}`}>
              <FaStar />
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            className={`star-icon star-button ${filled ? 'filled' : ''}`}
            onClick={() => onSelect(starValue)}
            onMouseEnter={() => onHover(starValue)}
            onMouseLeave={onLeave}
            aria-label={`Noter ${starValue} sur 5`}
          >
            <FaStar />
          </button>
        );
      })}
    </div>
  );
}

function CommentsSection({ eventId }) {
  const { isAuthenticated, user } = useAuth();
  const isAdminViewer = user?.role === 'admin';

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [newRating, setNewRating] = useState(0);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [busyCommentId, setBusyCommentId] = useState(null);

  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timeoutId = setTimeout(() => setFlashMessage(null), 3500);
    return () => clearTimeout(timeoutId);
  }, [flashMessage]);

  const fetchComments = async (showLoader = true) => {
    if (!eventId) {
      setComments([]);
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    setLoadingError('');

    try {
      const response = await commentsAPI.listByEvent(eventId, { limit: 200, skip: 0 });
      setComments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setLoadingError(error.response?.data?.detail || 'Impossible de charger les commentaires.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, [eventId]);

  const myComment = useMemo(() => {
    if (!user?.id) return null;
    return comments.find((comment) => comment.user_id === user.id) || null;
  }, [comments, user]);

  const averageRating = useMemo(() => {
    if (comments.length === 0) return 0;
    const total = comments.reduce((sum, current) => sum + Number(current.rating || 0), 0);
    return total / comments.length;
  }, [comments]);

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((ratingValue) => {
      const count = comments.filter((comment) => Number(comment.rating) === ratingValue).length;
      const ratio = comments.length === 0 ? 0 : (count / comments.length) * 100;
      return { ratingValue, count, ratio };
    });
  }, [comments]);

  const sortedComments = useMemo(() => {
    const clone = [...comments];

    return clone.sort((left, right) => {
      const leftDate = new Date(left.created_at).getTime() || 0;
      const rightDate = new Date(right.created_at).getTime() || 0;

      if (sortBy === 'oldest') return leftDate - rightDate;
      if (sortBy === 'highest') return Number(right.rating || 0) - Number(left.rating || 0) || rightDate - leftDate;
      if (sortBy === 'lowest') return Number(left.rating || 0) - Number(right.rating || 0) || rightDate - leftDate;
      return rightDate - leftDate;
    });
  }, [comments, sortBy]);

  const extractErrorMessage = (error, fallback) => {
    return error?.response?.data?.detail || fallback;
  };

  const canEditComment = (comment) => {
    if (!isAuthenticated() || !user) return false;
    return comment.user_id === user.id;
  };

  const canDeleteComment = (comment) => {
    if (!isAuthenticated() || !user) return false;
    return comment.user_id === user.id || isAdminViewer;
  };

  const resetNewCommentForm = () => {
    setNewRating(0);
    setNewHoverRating(0);
    setNewContent('');
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();
    const cleanedContent = newContent.trim();

    if (!newRating || !cleanedContent) {
      setFlashMessage({
        type: 'error',
        text: 'Ajoutez une note et un commentaire avant de publier.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await commentsAPI.create(eventId, {
        rating: newRating,
        content: cleanedContent,
      });

      const createdComment = response?.data;
      resetNewCommentForm();

      await fetchComments(false);

      if (createdComment?.is_hidden) {
        setFlashMessage({
          type: 'success',
          text: isAdminViewer
            ? 'Commentaire publié et masqué automatiquement par la modération.'
            : 'Commentaire enregistré. Il a été masqué automatiquement par la modération.',
        });
      } else {
        setFlashMessage({
          type: 'success',
          text: 'Votre avis a bien été publié.',
        });
      }
    } catch (error) {
      setFlashMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Impossible de publier votre commentaire.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditRating(Number(comment.rating || 0));
    setEditHoverRating(0);
    setEditContent(comment.content || '');
    setFlashMessage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(0);
    setEditHoverRating(0);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    const cleanedContent = editContent.trim();
    if (!editRating || !cleanedContent) {
      setFlashMessage({
        type: 'error',
        text: 'La note et le commentaire sont obligatoires.',
      });
      return;
    }

    setBusyCommentId(commentId);

    try {
      const response = await commentsAPI.update(commentId, {
        rating: editRating,
        content: cleanedContent,
      });

      setComments((prev) => prev.map((comment) => (comment.id === commentId ? response.data : comment)));
      cancelEditing();
      setFlashMessage({
        type: 'success',
        text: 'Commentaire mis à jour.',
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Impossible de modifier le commentaire.'),
      });
    } finally {
      setBusyCommentId(null);
    }
  };

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm('Supprimer ce commentaire ? Cette action est irréversible.');
    if (!confirmed) return;

    setBusyCommentId(commentId);

    try {
      await commentsAPI.delete(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      if (editingId === commentId) {
        cancelEditing();
      }
      setFlashMessage({
        type: 'success',
        text: 'Commentaire supprimé.',
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Impossible de supprimer le commentaire.'),
      });
    } finally {
      setBusyCommentId(null);
    }
  };

  const handleToggleHide = async (comment) => {
    setBusyCommentId(comment.id);

    try {
      const response = await commentsAPI.toggleHide(comment.id);
      const updated = response?.data;

      setComments((prev) => prev.map((item) => (item.id === comment.id ? updated : item)));
      setFlashMessage({
        type: 'success',
        text: updated?.is_hidden ? 'Commentaire masqué.' : 'Commentaire à nouveau visible.',
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        text: extractErrorMessage(error, 'Impossible de changer la visibilité du commentaire.'),
      });
    } finally {
      setBusyCommentId(null);
    }
  };

  return (
    <section className="comments-section">
      <div className="comments-header">
        <div>
          <p className="comments-kicker">Retour d'expérience</p>
          <h2>Commentaires de la communauté</h2>
          <p className="comments-subtitle">
            Notes et avis vérifiés, directement stockés en base et liés à cet événement.
          </p>
        </div>

        <div className="comments-sort-box">
          <label htmlFor="comments-sort">Trier</label>
          <select
            id="comments-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="comments-summary-grid">
        <article className="summary-panel score-panel">
          <p className="summary-label">Note moyenne</p>
          <p className="summary-score">{comments.length ? averageRating.toFixed(1) : '0.0'}</p>
          <StarRating value={averageRating} size="sm" />
          <p className="summary-help">Basé sur {comments.length} avis</p>
        </article>

        <article className="summary-panel">
          <p className="summary-label">Avis publiés</p>
          <p className="summary-score">{comments.length}</p>
          <p className="summary-help">Un seul avis par utilisateur et par événement.</p>
        </article>

        <article className="summary-panel breakdown-panel">
          {ratingDistribution.map(({ ratingValue, count, ratio }) => (
            <div key={ratingValue} className="breakdown-row">
              <span>{ratingValue}★</span>
              <div className="breakdown-track">
                <span style={{ width: `${ratio}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </article>
      </div>

      {flashMessage && (
        <div className={`comments-flash ${flashMessage.type}`}>
          {flashMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{flashMessage.text}</span>
        </div>
      )}

      {isAuthenticated() ? (
        <div className="comment-form-card">
          {myComment ? (
            <div className="existing-comment-note">
              <FaCommentDots />
              <span>
                Vous avez déjà publié un commentaire pour cet événement. Vous pouvez le modifier ci-dessous.
              </span>
            </div>
          ) : (
            <form onSubmit={handleCreateComment} className="comment-form">
              <div className="form-group">
                <label>Votre note</label>
                <StarRating
                  value={newRating}
                  hoverValue={newHoverRating}
                  onSelect={setNewRating}
                  onHover={setNewHoverRating}
                  onLeave={() => setNewHoverRating(0)}
                  interactive
                />
                <small>{newRating ? RATING_LABELS[newRating] : 'Cliquez sur une étoile pour noter.'}</small>
              </div>

              <div className="form-group">
                <label htmlFor="new-comment-content">Votre commentaire</label>
                <textarea
                  id="new-comment-content"
                  value={newContent}
                  onChange={(event) => setNewContent(event.target.value)}
                  placeholder="Décrivez votre expérience de façon utile pour les prochains participants..."
                  rows={4}
                  maxLength={2000}
                />
                <small>{newContent.trim().length} / 2000 caractères</small>
              </div>

              <button type="submit" className="btn-primary-comment" disabled={isSubmitting || !newRating || !newContent.trim()}>
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spin" /> Publication...
                  </>
                ) : (
                  'Publier mon avis'
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="login-prompt">
          Connectez-vous pour publier un avis et attribuer une note à cet événement.
        </div>
      )}

      <div className="comments-list-shell">
        {loading ? (
          <div className="comments-state">
            <FaSpinner className="spin" /> Chargement des commentaires...
          </div>
        ) : loadingError ? (
          <div className="comments-state error">
            <span>{loadingError}</span>
            <button type="button" onClick={() => fetchComments(false)}>Réessayer</button>
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="comments-state empty">
            Aucun avis pour le moment. Soyez le premier à partager votre expérience.
          </div>
        ) : (
          sortedComments.map((comment, index) => {
            const isEditingThis = editingId === comment.id;
            const canEdit = canEditComment(comment);
            const canDelete = canDeleteComment(comment);
            const canToggleHidden = isAdminViewer;

            return (
              <article
                key={comment.id}
                className={`comment-card ${isEditingThis ? 'is-editing' : ''} ${comment.is_hidden ? 'is-hidden' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="comment-avatar">{getInitials(comment.user_email)}</div>

                <div className="comment-content-block">
                  <header className="comment-top-row">
                    <div>
                      <div className="comment-author-line">
                        <p className="comment-author">{getDisplayName(comment.user_email)}</p>
                        {comment.is_admin_author && <span className="comment-badge admin">Admin</span>}
                        {comment.is_hidden && isAdminViewer && <span className="comment-badge hidden">Masque</span>}
                      </div>
                      <p className="comment-meta">
                        {formatDate(comment.created_at)}
                        {comment.is_edited && comment.updated_at ? ` • modifié ${formatDate(comment.updated_at)}` : ''}
                      </p>
                    </div>

                    {!isEditingThis && <StarRating value={Number(comment.rating || 0)} size="sm" />}
                  </header>

                  {isEditingThis ? (
                    <div className="edit-comment-box">
                      <StarRating
                        value={editRating}
                        hoverValue={editHoverRating}
                        onSelect={setEditRating}
                        onHover={setEditHoverRating}
                        onLeave={() => setEditHoverRating(0)}
                        interactive
                      />

                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={4}
                        maxLength={2000}
                      />

                      <div className="comment-action-row">
                        <button
                          type="button"
                          className="btn-save"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={busyCommentId === comment.id || !editRating || !editContent.trim()}
                        >
                          {busyCommentId === comment.id ? (
                            <>
                              <FaSpinner className="spin" /> Enregistrement...
                            </>
                          ) : (
                            'Enregistrer'
                          )}
                        </button>

                        <button type="button" className="btn-cancel" onClick={cancelEditing} disabled={busyCommentId === comment.id}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`comment-text ${comment.is_hidden ? 'hidden' : ''}`}>{comment.content}</p>

                      {(canEdit || canDelete || canToggleHidden) && (
                        <div className="comment-action-row">
                          {canEdit && (
                            <button type="button" className="btn-link-action" onClick={() => startEditing(comment)}>
                              <FaEdit /> Modifier
                            </button>
                          )}

                          {canToggleHidden && (
                            <button
                              type="button"
                              className="btn-link-action hide"
                              onClick={() => handleToggleHide(comment)}
                              disabled={busyCommentId === comment.id}
                            >
                              {busyCommentId === comment.id ? (
                                <>
                                  <FaSpinner className="spin" /> Traitement...
                                </>
                              ) : (
                                <>
                                  {comment.is_hidden ? <FaEye /> : <FaEyeSlash />} {comment.is_hidden ? 'Afficher' : 'Masquer'}
                                </>
                              )}
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="btn-link-action danger"
                              onClick={() => handleDelete(comment.id)}
                              disabled={busyCommentId === comment.id}
                            >
                              {busyCommentId === comment.id ? (
                                <>
                                  <FaSpinner className="spin" /> Suppression...
                                </>
                              ) : (
                                <>
                                  <FaTrash /> Supprimer
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default CommentsSection;