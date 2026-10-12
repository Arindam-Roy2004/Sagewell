import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

/**
 * Credit balance and the two credit dialogs (details, and "you're out").
 *
 * The balance arrives with the signed-in user (authStore) and is refreshed after anything
 * that spends credits. The server is the source of truth: it rejects spending with a 402,
 * which the other stores route through `handleCreditError`.
 */
export const useCreditStore = create((set, get) => ({
  credits: null, // { granted, balance, spent, exhausted, urlSources: { used, max } }
  pricing: null,
  transactions: [],
  isLoading: false,

  dialogOpen: false,
  exhaustedOpen: false,
  exhaustedMessage: '',

  setCredits: (credits) => {
    if (credits) set({ credits });
  },

  fetchCredits: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get('/credits');
      set({
        credits: res.data.credits,
        pricing: res.data.pricing,
        transactions: res.data.transactions || [],
      });
    } catch (error) {
      console.error('Fetch credits error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // The server settles a request's final cost when its response closes, a moment after the
  // client sees it finish, so refresh after a short delay to pick up the settled balance.
  refreshSoon: (delay = 1200) => {
    setTimeout(() => get().fetchCredits(), delay);
  },

  setDialogOpen: (open) => {
    set({ dialogOpen: open });
    if (open) get().fetchCredits();
  },

  setExhaustedOpen: (open) => set({ exhaustedOpen: open }),

  showExhausted: (credits, message) =>
    set((state) => ({
      credits: credits || state.credits,
      exhaustedOpen: true,
      exhaustedMessage: message || '',
    })),

  reset: () => set({ credits: null, pricing: null, transactions: [], dialogOpen: false, exhaustedOpen: false }),
}));

/**
 * If a failed response is the server saying "out of credits", opens the exhausted dialog and
 * returns true so the caller can skip its own error toast.
 */
export function handleCreditError(status, data) {
  if (status !== 402 || data?.code !== 'INSUFFICIENT_CREDITS') return false;
  useCreditStore.getState().showExhausted(data.credits, data.message);
  return true;
}
