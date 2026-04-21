import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaHome, FaSpinner, FaTicketAlt } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersAPI, paymentsAPI } from '../services/api';
import '../styles/PaymentPages.css';

function formatAmount(amount, currency) {
  const value = Number(amount || 0);
  const code = (currency || 'USD').toUpperCase();

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const queryOrderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const authenticated = isAuthenticated();

  const paymentStatus = (order?.payment_status || '').toUpperCase();
  const currencyCode = (order?.payment_currency || 'usd').toUpperCase();
  const isPaid = paymentStatus === 'PAID';

  const totalItems = useMemo(() => {
    return (order?.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [order]);

  useEffect(() => {
    const syncAndLoad = async () => {
      if (!authenticated) {
        setErrorMessage('Connectez-vous pour consulter le statut de votre commande.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        let targetOrderId = queryOrderId;

        if (sessionId) {
          const syncResponse = await paymentsAPI.syncCheckoutSession(sessionId);
          if (!targetOrderId && syncResponse?.data?.order_id) {
            targetOrderId = String(syncResponse.data.order_id);
          }
        }

        if (!targetOrderId) {
          setErrorMessage('Référence de commande manquante.');
          return;
        }

        const confirmedOrderResponse = await ordersAPI.getOrderById(targetOrderId);
        setOrder(confirmedOrderResponse.data);

        if ((confirmedOrderResponse.data?.payment_status || '').toUpperCase() === 'PAID') {
          await refreshCart();
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.detail || 'Impossible de récupérer votre paiement.');
      } finally {
        setLoading(false);
      }
    };

    syncAndLoad();
  }, [queryOrderId, sessionId, authenticated, refreshCart]);

  return (
    <div className="payment-page payment-success">
      <div className="payment-card">
        <div className="payment-icon-wrap success">
          {isPaid ? <FaCheckCircle /> : <FaClock />}
        </div>

        <h1>{isPaid ? 'Paiement confirmé' : 'Paiement en cours de confirmation'}</h1>
        <p className="payment-subtitle">
          {isPaid
            ? 'Votre commande a été payée et enregistrée avec succès.'
            : 'Stripe a renvoyé votre session. Nous finalisons la commande...'}
        </p>

        {loading ? (
          <div className="payment-state loading">
            <FaSpinner className="spin" /> Synchronisation du paiement...
          </div>
        ) : errorMessage ? (
          <div className="payment-state error">{errorMessage}</div>
        ) : order ? (
          <div className="payment-order-box">
            <div className="order-meta-grid">
              <div>
                <span>Commande</span>
                <strong>#{order.id}</strong>
              </div>
              <div>
                <span>Statut</span>
                <strong className={isPaid ? 'status-paid' : 'status-pending'}>
                  {order.payment_status}
                </strong>
              </div>
              <div>
                <span>Articles</span>
                <strong>{totalItems}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatAmount(order.total_amount, currencyCode)}</strong>
              </div>
            </div>

            <div className="order-items-preview">
              {(order.items || []).map((item) => (
                <div key={item.id} className="order-item-row">
                  <div>
                    <p>{item.event_title}</p>
                    <small>{item.ticket_name}</small>
                  </div>
                  <strong>
                    {item.quantity} x {formatAmount(item.unit_price, currencyCode)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="payment-actions">
          <button className="payment-btn" onClick={() => navigate('/')}>
            <FaHome /> Retour au catalogue
          </button>
          <button
            className="payment-btn ghost"
            onClick={() => navigate(isPaid ? '/profile' : '/cart')}
          >
            <FaTicketAlt /> {isPaid ? 'Voir mes tickets' : 'Voir le panier'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
