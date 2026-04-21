import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaRedoAlt, FaTimesCircle } from 'react-icons/fa';

import '../styles/PaymentPages.css';

function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="payment-page payment-cancel">
      <div className="payment-card">
        <div className="payment-icon-wrap cancel">
          <FaTimesCircle />
        </div>

        <h1>Paiement annulé</h1>
        <p className="payment-subtitle">
          Aucun débit n'a été effectué. Vous pouvez reprendre le checkout quand vous voulez.
        </p>

        {orderId && (
          <p className="payment-order-ref">
            Référence commande: <strong>#{orderId}</strong>
          </p>
        )}

        <div className="payment-actions">
          <button className="payment-btn" onClick={() => navigate('/cart')}>
            <FaRedoAlt /> Reprendre le paiement
          </button>
          <button className="payment-btn ghost" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Retour
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
