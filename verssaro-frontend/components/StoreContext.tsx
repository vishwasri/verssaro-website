'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch, getAuthToken, setAuthToken } from '@/lib/api';
import { formatMoney } from '@/lib/currency';
import {
  CartState,
  CurrencyCode,
  UserDossier,
  WishlistItem,
} from '@/lib/types';

interface StoreContextValue {
  cart: CartState | null;
  wishlist: WishlistItem[];
  wishlistProductIds: Set<string>;
  dossier: UserDossier | null;
  isAuthenticated: boolean;
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountUsd: number, withCode?: boolean) => string;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  refreshDossier: () => Promise<void>;
  signOut: () => void;
  addToCart: (input: {
    productId: string;
    size: string;
    colorName?: string;
    colorHex?: string;
    quantity?: number;
  }) => Promise<void>;
  updateCartQty: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
  updateCartMeta: (meta: {
    collectorBox?: boolean;
    giftMessage?: string;
  }) => Promise<void>;
  toggleWishlist: (input: {
    productId: string;
    selectedSize?: string;
    selectedColor?: string;
  }) => Promise<void>;
  toast: { id: number; message: string; tone?: 'default' | 'error' } | null;
  announce: (message: string, tone?: 'default' | 'error') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [dossier, setDossier] = useState<UserDossier | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone?: 'default' | 'error';
  } | null>(null);

  const announce = useCallback(
    (message: string, tone: 'default' | 'error' = 'default') => {
      const id = Date.now();
      setToast({ id, message, tone });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3600);
    },
    [],
  );

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('verssaro_currency', code);
    }
  }, []);

  const formatPrice = useCallback(
    (amountUsd: number, withCode = false) =>
      formatMoney(amountUsd, currency, withCode),
    [currency],
  );

  const refreshCart = useCallback(async () => {
    try {
      const data = await apiFetch<CartState>('/cart');
      setCart(data);
    } catch {
      // backend may be restarting
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: WishlistItem[] }>('/wishlist');
      setWishlist(data.items);
    } catch {
      // ignore initial offline error
    }
  }, []);

  const refreshDossier = useCallback(async () => {
    setIsAuthenticated(Boolean(getAuthToken()));
    try {
      const data = await apiFetch<{ user: UserDossier }>('/auth/dossier');
      setDossier(data.user);
    } catch {
      // ignore initial offline error
    }
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setIsAuthenticated(false);
    void refreshDossier();
    announce('SIGNED OUT OF CLIENT DOSSIER');
  }, [announce, refreshDossier]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (typeof window !== 'undefined') {
        setIsAuthenticated(Boolean(getAuthToken()));
        const saved = window.localStorage.getItem('verssaro_currency') as
          | CurrencyCode
          | null;
        if (saved === 'USD' || saved === 'LKR' || saved === 'EUR') {
          setCurrencyState(saved);
        }
      }
    });
    apiFetch<CartState>('/cart')
      .then((d) => {
        if (active) setCart(d);
      })
      .catch(() => {});
    apiFetch<{ items: WishlistItem[] }>('/wishlist')
      .then((d) => {
        if (active) setWishlist(d.items);
      })
      .catch(() => {});
    apiFetch<{ user: UserDossier }>('/auth/dossier')
      .then((d) => {
        if (active) setDossier(d.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const addToCart = useCallback(
    async (input: {
      productId: string;
      size: string;
      colorName?: string;
      colorHex?: string;
      quantity?: number;
    }) => {
      const next = await apiFetch<CartState>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setCart(next);
      announce(`ADDED PIECE (${input.size}) TO ARCHIVE BAG`);
    },
    [announce],
  );

  const updateCartQty = useCallback(async (itemId: string, quantity: number) => {
    const next = await apiFetch<CartState>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    setCart(next);
  }, []);

  const removeCartItem = useCallback(
    async (itemId: string) => {
      const next = await apiFetch<CartState>(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      setCart(next);
      announce('REMOVED PIECE FROM BAG');
    },
    [announce],
  );

  const applyPromoCode = useCallback(
    async (code: string) => {
      const next = await apiFetch<CartState>('/cart/promo', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setCart(next);
      announce(code ? `PROMO ${code.toUpperCase()} APPLIED` : 'PROMO CLEARED');
    },
    [announce],
  );

  const updateCartMeta = useCallback(
    async (meta: { collectorBox?: boolean; giftMessage?: string }) => {
      const next = await apiFetch<CartState>('/cart/meta', {
        method: 'PATCH',
        body: JSON.stringify(meta),
      });
      setCart(next);
    },
    [],
  );

  const toggleWishlist = useCallback(
    async (input: {
      productId: string;
      selectedSize?: string;
      selectedColor?: string;
    }) => {
      const res = await apiFetch<{
        action: 'added' | 'removed';
        items: WishlistItem[];
      }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setWishlist(res.items);
      announce(
        res.action === 'added'
          ? 'SAVED TO ARCHIVE WISHLIST'
          : 'REMOVED FROM WISHLIST',
      );
    },
    [announce],
  );

  const wishlistProductIds = new Set(wishlist.map((w) => w.productId));

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        wishlistProductIds,
        dossier,
        isAuthenticated,
        currency,
        setCurrency,
        formatPrice,
        refreshCart,
        refreshWishlist,
        refreshDossier,
        signOut,
        addToCart,
        updateCartQty,
        removeCartItem,
        applyPromoCode,
        updateCartMeta,
        toggleWishlist,
        toast,
        announce,
      }}
    >
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 left-6 z-50 pointer-events-none"
        role="status"
      >
        {toast ? (
          <div
            className={`pointer-events-auto px-5 py-3 shadow-2xl flex items-center gap-3 font-data-mono text-data-mono uppercase tracking-wider ${
              toast.tone === 'error'
                ? 'bg-error-container text-on-error-container'
                : 'bg-on-surface text-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {toast.tone === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        ) : null}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
