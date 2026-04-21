import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { ordersAPI } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const canUseCart = useMemo(() => {
    const role = user?.role;
    return role === 'client' || role === 'admin';
  }, [user]);

  const refreshCart = useCallback(async () => {
    if (!token || !canUseCart) {
      setCart(null);
      return null;
    }

    setLoading(true);
    try {
      const res = await ordersAPI.getCart();
      setCart(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [canUseCart, token]);

  useEffect(() => {
    if (authLoading) return;
    refreshCart().catch((err) => {
      console.error('Erreur chargement panier:', err);
      setCart(null);
    });
  }, [authLoading, refreshCart]);

  const addToCart = useCallback(async (ticketTypeId, quantity) => {
    const res = await ordersAPI.addCartItem(ticketTypeId, quantity);
    setCart(res.data);
    return res.data;
  }, []);

  const updateCartItem = useCallback(async (itemId, quantity) => {
    const res = await ordersAPI.updateCartItem(itemId, quantity);
    setCart(res.data);
    return res.data;
  }, []);

  const removeCartItem = useCallback(async (itemId) => {
    await ordersAPI.deleteCartItem(itemId);
    return refreshCart();
  }, [refreshCart]);

  const checkoutCart = useCallback(async () => {
    const origin = window.location.origin;
    const res = await ordersAPI.createCheckoutSession({
      success_url: `${origin}/payment/success`,
      cancel_url: `${origin}/payment/cancel`,
    });
    return res.data;
  }, []);

  const cartItems = cart?.items || [];
  const cartItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const value = {
    cart,
    cartItems,
    cartItemCount,
    loading,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    checkoutCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
