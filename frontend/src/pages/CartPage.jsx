import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaMinus, FaTrash, FaShoppingCart } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/CartPage.css';

function CartPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    cartItems,
    cart,
    loading,
    updateCartItem,
    removeCartItem,
    checkoutCart,
  } = useCart();

  const [busyItemId, setBusyItemId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const groupedByEvent = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const key = item.event_id;
      if (!acc[key]) {
        acc[key] = {
          eventTitle: item.event_title,
          items: [],
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});
  }, [cartItems]);

  const total = cart?.total_amount || 0;

  if (authLoading) {
    return <div className="cart-page"><p>Chargement...</p></div>;
  }

  if (!isAuthenticated()) {
    return (
      <div className="cart-page">
        <div className="cart-empty-card">
          <h2>Connexion requise</h2>
          <p>Connectez-vous pour accéder à votre panier.</p>
          <button className="cart-btn primary" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'client' && user?.role !== 'admin') {
    return (
      <div className="cart-page">
        <div className="cart-empty-card">
          <h2>Accès non autorisé</h2>
          <p>Le panier est réservé aux clients.</p>
          <button className="cart-btn" onClick={() => navigate('/')}>
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const changeQuantity = async (item, delta) => {
    const nextQty = item.quantity + delta;
    if (nextQty < 1) return;

    try {
      setBusyItemId(item.id);
      await updateCartItem(item.id, nextQty);
    } catch (err) {
      alert(err.response?.data?.detail || 'Impossible de modifier la quantité');
    } finally {
      setBusyItemId(null);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      setBusyItemId(itemId);
      await removeCartItem(itemId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Impossible de supprimer cet article');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      setIsCheckingOut(true);
      const confirmedOrder = await checkoutCart();
      alert(`Commande #${confirmedOrder.id} confirmée avec succès.`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.detail || 'Checkout impossible');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-header-row">
        <button className="cart-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </button>
        <h1><FaShoppingCart /> Mon Panier</h1>
      </div>

      {loading ? (
        <p>Chargement du panier...</p>
      ) : cartItems.length === 0 ? (
        <div className="cart-empty-card">
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des tickets depuis la page d'un événement.</p>
          <button className="cart-btn primary" onClick={() => navigate('/')}>
            Explorer les événements
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-panel">
            {Object.entries(groupedByEvent).map(([eventId, group]) => (
              <div key={eventId} className="cart-event-group">
                <h3>{group.eventTitle}</h3>

                {group.items.map((item) => (
                  <div key={item.id} className="cart-line">
                    <div className="cart-line-info">
                      <h4>{item.ticket_name}</h4>
                      <p>{item.unit_price} TND / ticket</p>
                    </div>

                    <div className="cart-line-actions">
                      <button
                        className="qty-btn"
                        onClick={() => changeQuantity(item, -1)}
                        disabled={busyItemId === item.id}
                      >
                        <FaMinus />
                      </button>

                      <span className="qty-value">{item.quantity}</span>

                      <button
                        className="qty-btn"
                        onClick={() => changeQuantity(item, 1)}
                        disabled={busyItemId === item.id}
                      >
                        <FaPlus />
                      </button>

                      <button
                        className="delete-line-btn"
                        onClick={() => deleteItem(item.id)}
                        disabled={busyItemId === item.id}
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="cart-line-subtotal">
                      {item.subtotal.toFixed(2)} TND
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="cart-summary-panel">
            <h3>Résumé</h3>
            <div className="summary-row">
              <span>Articles</span>
              <strong>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{Number(total).toFixed(2)} TND</strong>
            </div>

            <button
              className="cart-btn checkout"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? 'Validation...' : 'Valider la commande'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
