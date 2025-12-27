'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Provider, Tier } from '@/types';

export type ProviderWithTier = Provider & { tier: Tier | null };

export const getProviders = async (): Promise<Provider[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  return data || [];
};

export const getProvider = async (id: string): Promise<Provider | null> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching provider:', error);
    return null;
  }

  return data;
};

export const createProvider = async (
  _prevState: ActionResult<Provider>,
  formData: FormData
): Promise<ActionResult<Provider>> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const tierId = formData.get('tierId') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const mainThreadUrl = formData.get('mainThreadUrl') as string;
  const rechargeUrl = formData.get('rechargeUrl') as string;
  const rechargeUrl2 = formData.get('rechargeUrl2') as string;
  const remarks = formData.get('remarks') as string;
  const requiresDailyLogin = formData.get('requiresDailyLogin') === 'on';

  if (!name?.trim()) {
    return { success: false, error: 'Provider name is required' };
  }

  const provider = {
    owner_id: user.id,
    name: name.trim(),
    tier_id: tierId?.trim() || null,
    website_url: websiteUrl?.trim() || null,
    main_thread_url: mainThreadUrl?.trim() || null,
    recharge_url: rechargeUrl?.trim() || null,
    recharge_url_2: rechargeUrl2?.trim() || null,
    remarks: remarks?.trim() || null,
    requires_daily_login: requiresDailyLogin,
  };

  const { data, error } = await supabase
    .from('providers')
    .insert(provider)
    .select()
    .single();

  if (error) {
    console.error('Error creating provider:', error);
    return { success: false, error: 'Failed to create provider' };
  }

  revalidatePath('/providers');
  return { success: true, data };
};

export const updateProvider = async (
  _prevState: ActionResult<Provider>,
  formData: FormData
): Promise<ActionResult<Provider>> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const tierId = formData.get('tierId') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const mainThreadUrl = formData.get('mainThreadUrl') as string;
  const rechargeUrl = formData.get('rechargeUrl') as string;
  const rechargeUrl2 = formData.get('rechargeUrl2') as string;
  const remarks = formData.get('remarks') as string;
  const requiresDailyLogin = formData.get('requiresDailyLogin') === 'on';

  if (!id) {
    return { success: false, error: 'Provider ID is required' };
  }

  if (!name?.trim()) {
    return { success: false, error: 'Provider name is required' };
  }

  const { data, error } = await supabase
    .from('providers')
    .update({
      name: name.trim(),
      tier_id: tierId?.trim() || null,
      website_url: websiteUrl?.trim() || null,
      main_thread_url: mainThreadUrl?.trim() || null,
      recharge_url: rechargeUrl?.trim() || null,
      recharge_url_2: rechargeUrl2?.trim() || null,
      remarks: remarks?.trim() || null,
      requires_daily_login: requiresDailyLogin,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating provider:', error);
    return { success: false, error: 'Failed to update provider' };
  }

  revalidatePath('/providers');
  revalidatePath(`/providers/${id}`);
  return { success: true, data };
};

export const deleteProvider = async (id: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Soft delete
  const { error } = await supabase
    .from('providers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting provider:', error);
    return { success: false, error: 'Failed to delete provider' };
  }

  revalidatePath('/providers');
  return { success: true };
};

export const claimDailyReward = async (id: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('providers')
    .update({ last_reward_claimed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error claiming reward:', error);
    return { success: false, error: 'Failed to claim reward' };
  }

  revalidatePath('/providers');
  revalidatePath('/daily-rewards');
  return { success: true };
};

export const getProvidersRequiringDailyLogin = async (): Promise<ProviderWithTier[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('providers')
    .select('*, tier:tiers(*)')
    .eq('requires_daily_login', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Sort by tier sort_order (ascending), providers without tiers go last
  const sorted = (data || []).sort((a, b) => {
    const aTierOrder = a.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bTierOrder = b.tier?.sort_order ?? Number.MAX_SAFE_INTEGER;
    return aTierOrder - bTierOrder;
  });

  return sorted;
};
