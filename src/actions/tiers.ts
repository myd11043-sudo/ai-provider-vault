'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import type { Tier } from '@/types/supabase';

export const getTiers = async (): Promise<Tier[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching tiers:', error);
    return [];
  }

  return (data as Tier[]) || [];
};

export const getTier = async (id: string): Promise<Tier | null> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tiers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching tier:', error);
    return null;
  }

  return data as Tier;
};

export const createTier = async (
  _prevState: ActionResult<Tier>,
  formData: FormData
): Promise<ActionResult<Tier>> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const label = formData.get('label') as string;
  const description = formData.get('description') as string;
  const color = formData.get('color') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!name?.trim()) {
    return { success: false, error: 'Tier name is required' };
  }

  if (!label?.trim()) {
    return { success: false, error: 'Tier label is required' };
  }

  const tier = {
    owner_id: user.id,
    name: name.trim(),
    label: label.trim(),
    description: description?.trim() || null,
    color: color || 'bg-zinc-500 text-white',
    sort_order: sortOrder,
  };

  const { data, error } = await supabase
    .from('tiers')
    .insert(tier)
    .select()
    .single();

  if (error) {
    console.error('Error creating tier:', error);
    if (error.code === '23505') {
      return { success: false, error: 'A tier with this name already exists' };
    }
    return { success: false, error: 'Failed to create tier' };
  }

  revalidatePath('/tiers');
  return { success: true, data: data as Tier };
};

export const updateTier = async (
  _prevState: ActionResult<Tier>,
  formData: FormData
): Promise<ActionResult<Tier>> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const label = formData.get('label') as string;
  const description = formData.get('description') as string;
  const color = formData.get('color') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

  if (!id) {
    return { success: false, error: 'Tier ID is required' };
  }

  if (!name?.trim()) {
    return { success: false, error: 'Tier name is required' };
  }

  if (!label?.trim()) {
    return { success: false, error: 'Tier label is required' };
  }

  const { data, error } = await supabase
    .from('tiers')
    .update({
      name: name.trim(),
      label: label.trim(),
      description: description?.trim() || null,
      color: color || 'bg-zinc-500 text-white',
      sort_order: sortOrder,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tier:', error);
    if (error.code === '23505') {
      return { success: false, error: 'A tier with this name already exists' };
    }
    return { success: false, error: 'Failed to update tier' };
  }

  revalidatePath('/tiers');
  return { success: true, data: data as Tier };
};

export const deleteTier = async (id: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if any providers are using this tier
  const { data: providers } = await supabase
    .from('providers')
    .select('id')
    .eq('tier_id', id)
    .is('deleted_at', null)
    .limit(1);

  if (providers && providers.length > 0) {
    return { success: false, error: 'Cannot delete tier: it is being used by providers' };
  }

  const { error } = await supabase
    .from('tiers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting tier:', error);
    return { success: false, error: 'Failed to delete tier' };
  }

  revalidatePath('/tiers');
  return { success: true };
};

export const seedDefaultTiers = async (): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if user already has tiers
  const { data: existing } = await supabase
    .from('tiers')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'Tiers already exist' };
  }

  const defaultTiers = [
    { name: 'S', label: 'S Tier', description: 'SOTA models, reliable source, excellent latency, premium quality', color: 'bg-amber-500 text-white', sort_order: 0 },
    { name: 'A', label: 'A Tier', description: 'Great models, easy credits, source may vary', color: 'bg-purple-500 text-white', sort_order: 1 },
    { name: 'B', label: 'B Tier', description: 'Good models, may lack SOTA or recharge options', color: 'bg-blue-500 text-white', sort_order: 2 },
    { name: 'C', label: 'C Tier', description: 'Basic functionality, limited model selection', color: 'bg-zinc-500 text-white', sort_order: 3 },
    { name: 'D', label: 'D Tier', description: 'Minimal features, use as backup only', color: 'bg-zinc-400 text-white', sort_order: 4 },
  ];

  const { error } = await supabase
    .from('tiers')
    .insert(defaultTiers.map(t => ({ ...t, owner_id: user.id })));

  if (error) {
    console.error('Error seeding tiers:', error);
    return { success: false, error: 'Failed to create default tiers' };
  }

  revalidatePath('/tiers');
  return { success: true };
};
