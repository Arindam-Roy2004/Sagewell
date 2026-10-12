import { create } from 'zustand';
import { toast } from 'sonner';
import { axiosInstance } from '../lib/axios';

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/** Admin dashboard data: account overview, the users table, sign-ins and one open user. */
export const useAdminStore = create((set, get) => ({
  overview: null,
  users: [],
  pagination: { page: 1, pages: 1, total: 0 },
  query: { q: '', sort: 'active', page: 1 },
  signIns: [],
  selectedUser: null, // { user, signIns, transactions, sources }
  selectedUserId: null,

  isLoadingOverview: false,
  isLoadingUsers: false,
  isLoadingUser: false,
  isGranting: false,

  fetchOverview: async () => {
    try {
      set({ isLoadingOverview: true });
      const res = await axiosInstance.get('/admin/overview', { params: { tz: timeZone() } });
      set({ overview: res.data.overview });
    } catch (error) {
      console.error('Admin overview error:', error);
      if (error.response?.status !== 403) toast.error('Could not load the overview');
    } finally {
      set({ isLoadingOverview: false });
    }
  },

  fetchUsers: async (changes = {}) => {
    const query = { ...get().query, ...changes };
    set({ query, isLoadingUsers: true });
    try {
      const res = await axiosInstance.get('/admin/users', { params: query });
      // Ignore a slower response for a query the admin has already changed.
      if (get().query !== query) return;
      set({ users: res.data.users, pagination: res.data.pagination });
    } catch (error) {
      console.error('Admin users error:', error);
      if (error.response?.status !== 403) toast.error('Could not load users');
    } finally {
      if (get().query === query) set({ isLoadingUsers: false });
    }
  },

  fetchSignIns: async () => {
    try {
      const res = await axiosInstance.get('/admin/sign-ins', { params: { limit: 8 } });
      set({ signIns: res.data.signIns });
    } catch (error) {
      console.error('Admin sign-ins error:', error);
    }
  },

  refreshAll: () => {
    const { fetchOverview, fetchUsers, fetchSignIns } = get();
    return Promise.all([fetchOverview(), fetchUsers(), fetchSignIns()]);
  },

  openUser: async (userId) => {
    set({ selectedUserId: userId, isLoadingUser: true, selectedUser: null });
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}`);
      if (get().selectedUserId === userId) set({ selectedUser: res.data });
    } catch (error) {
      console.error('Admin user error:', error);
      toast.error('Could not load this account');
      set({ selectedUserId: null });
    } finally {
      set({ isLoadingUser: false });
    }
  },

  closeUser: () => set({ selectedUserId: null, selectedUser: null }),

  addCredits: async (userId, credits) => {
    try {
      set({ isGranting: true });
      const res = await axiosInstance.post(`/admin/users/${userId}/credits`, { credits });
      const updated = res.data.credits;
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? { ...u, credits: updated } : u)),
      }));
      toast.success(`Added ${credits} credits`);
      await get().openUser(userId);
      get().fetchOverview();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add credits');
      return false;
    } finally {
      set({ isGranting: false });
    }
  },
}));
