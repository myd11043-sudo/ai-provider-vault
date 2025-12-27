'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult, ApiKey } from '@/types';

export const getApiKeysForProvider = async (providerId: string): Promise<ApiKey[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('provider_id', providerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }

  return (data as ApiKey[]) || [];
};

export const getAllApiKeys = async (): Promise<(ApiKey & { provider_name: string })[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get API keys with provider info
  const { data: apiKeys, error: keysError } = await supabase
    .from('api_keys')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (keysError || !apiKeys || apiKeys.length === 0) {
    if (keysError) console.error('Error fetching API keys:', keysError);
    return [];
  }

  // Get provider names
  const typedKeys = apiKeys as ApiKey[];
  const providerIds = [...new Set(typedKeys.map((k) => k.provider_id))];
  const { data: providers } = await supabase
    .from('providers')
    .select('id, name')
    .in('id', providerIds);

  const providerMap = new Map(
    (providers as { id: string; name: string }[] | null)?.map((p) => [p.id, p.name]) || []
  );

  return typedKeys.map((key) => ({
    ...key,
    provider_name: providerMap.get(key.provider_id) || 'Unknown',
  }));
};

export const storeApiKey = async (
  _prevState: ActionResult<string>,
  formData: FormData
): Promise<ActionResult<string>> => {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const providerId = formData.get('providerId') as string;
  const label = formData.get('label') as string;
  const apiKey = formData.get('apiKey') as string;

  if (!providerId) {
    return { success: false, error: 'Provider ID is required' };
  }

  if (!label?.trim()) {
    return { success: false, error: 'Label is required' };
  }

  if (!apiKey?.trim()) {
    return { success: false, error: 'API key is required' };
  }

  try {
    // Use the Vault function to store the key securely
    const { data, error } = await serviceSupabase.rpc('store_api_key', {
      p_owner_id: user.id,
      p_provider_id: providerId,
      p_label: label.trim(),
      p_api_key: apiKey.trim(),
    });

    if (error) {
      console.error('Error storing API key:', error);
      return { success: false, error: error.message || 'Failed to store API key' };
    }

    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/api-keys');
    return { success: true, data: data as string };
  } catch (err) {
    console.error('Error storing API key:', err);
    return { success: false, error: 'Failed to store API key' };
  }
};

export const revealApiKey = async (apiKeyId: string): Promise<ActionResult<string>> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase.rpc('get_decrypted_api_key', {
      p_api_key_id: apiKeyId,
    });

    if (error) {
      console.error('Error revealing API key:', error);
      return { success: false, error: error.message || 'Failed to reveal API key' };
    }

    return { success: true, data: data as string };
  } catch (err) {
    console.error('Error revealing API key:', err);
    return { success: false, error: 'Failed to reveal API key' };
  }
};

export const deleteApiKey = async (apiKeyId: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase.rpc('delete_api_key', {
      p_api_key_id: apiKeyId,
    });

    if (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: error.message || 'Failed to delete API key' };
    }

    revalidatePath('/providers');
    revalidatePath('/api-keys');
    return { success: true };
  } catch (err) {
    console.error('Error deleting API key:', err);
    return { success: false, error: 'Failed to delete API key' };
  }
};
