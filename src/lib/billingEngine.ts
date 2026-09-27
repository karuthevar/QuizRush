import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { HostBillingProfile, PaymentTransaction } from './types';

const BILLING_STORAGE_PREFIX = 'quizrush_billing_';

export const getBillingProfile = async (userId: string = 'guest-host'): Promise<HostBillingProfile> => {
  const defaultProfile: HostBillingProfile = {
    userId,
    freeTrialsTotal: 1, // 1 free trial out of the box
    freeTrialsUsed: 0,
    paidCredits: 0,
    totalQuizzesHosted: 0,
    paymentHistory: [],
  };

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`${BILLING_STORAGE_PREFIX}${userId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'billing', userId));
      if (snap.exists()) {
        const remoteProfile = snap.data() as HostBillingProfile;
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${BILLING_STORAGE_PREFIX}${userId}`, JSON.stringify(remoteProfile));
        }
        return remoteProfile;
      }
    } catch (e) {
      console.warn('Error reading billing profile from Firestore:', e);
    }
  }

  // Save default profile if none exists
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${BILLING_STORAGE_PREFIX}${userId}`, JSON.stringify(defaultProfile));
  }
  return defaultProfile;
};

export const saveBillingProfile = async (profile: HostBillingProfile): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${BILLING_STORAGE_PREFIX}${profile.userId}`, JSON.stringify(profile));
    window.dispatchEvent(new Event('quizrush_billing_change'));
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'billing', profile.userId), profile);
    } catch (e) {
      console.warn('Error saving billing profile to Firestore:', e);
    }
  }
};

export const checkCanHost = async (
  userId: string = 'guest-host'
): Promise<{ canHost: boolean; freeTrialsRemaining: number; paidCredits: number }> => {
  const profile = await getBillingProfile(userId);
  const freeTrialsRemaining = Math.max(0, profile.freeTrialsTotal - profile.freeTrialsUsed);
  const canHost = freeTrialsRemaining > 0 || profile.paidCredits > 0;

  return {
    canHost,
    freeTrialsRemaining,
    paidCredits: profile.paidCredits,
  };
};

export const consumeHostCredit = async (userId: string = 'guest-host'): Promise<boolean> => {
  const profile = await getBillingProfile(userId);

  if (profile.freeTrialsUsed < profile.freeTrialsTotal) {
    // Consume free trial
    profile.freeTrialsUsed += 1;
    profile.totalQuizzesHosted += 1;
    await saveBillingProfile(profile);
    return true;
  } else if (profile.paidCredits > 0) {
    // Consume paid credit
    profile.paidCredits -= 1;
    profile.totalQuizzesHosted += 1;
    await saveBillingProfile(profile);
    return true;
  }

  return false;
};

export const addHostCredits = async (
  userId: string = 'guest-host',
  count: number = 1,
  transaction?: Partial<PaymentTransaction>
): Promise<HostBillingProfile> => {
  const profile = await getBillingProfile(userId);
  profile.paidCredits += count;

  const newTx: PaymentTransaction = {
    id: transaction?.id || `tx_${Date.now()}`,
    amount: transaction?.amount || 499 * count,
    currency: 'USD',
    date: Date.now(),
    status: transaction?.status || 'paid',
    creditsAdded: count,
    receiptUrl: transaction?.receiptUrl,
  };

  profile.paymentHistory = [newTx, ...(profile.paymentHistory || [])];
  await saveBillingProfile(profile);
  return profile;
};

export const resetBillingDemo = async (userId: string = 'guest-host'): Promise<void> => {
  const fresh: HostBillingProfile = {
    userId,
    freeTrialsTotal: 1,
    freeTrialsUsed: 0,
    paidCredits: 0,
    totalQuizzesHosted: 0,
    paymentHistory: [],
  };
  await saveBillingProfile(fresh);
};
