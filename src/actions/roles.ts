'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ActionResult, Role, SharedKeyWithProvider } from '@/types';

export interface UserWithRole {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface MemberWithEmail {
  id: string;
  user_id: string;
  role: Role;
  email: string;
  created_at: string;
}

export interface ApiKeyWithProvider {
  id: string;
  label: string;
  key_prefix: string | null;
  provider_id: string;
  provider_name: string;
  sharedWith: string[];
}

/**
 * Get current user's role
 */
export const getCurrentUserRole = async (): Promise<Role> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'none';

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return (data?.role as Role) || 'none';
};

/**
 * Check if current user is super admin
 */
export const isSuperAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === 'super_admin';
};

/**
 * Check if current user is a member
 */
export const isMember = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === 'member';
};

/**
 * Initialize current user as super admin (first user only)
 */
export const initializeSuperAdmin = async (): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if any roles exist
  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('id')
    .limit(1);

  if (existingRoles && existingRoles.length > 0) {
    return { success: false, error: 'Roles already initialized' };
  }

  // Create super admin role for current user
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: user.id,
      role: 'super_admin',
    });

  if (error) {
    console.error('Error initializing super admin:', error);
    return { success: false, error: 'Failed to initialize super admin' };
  }

  revalidatePath('/');
  return { success: true };
};

/**
 * Get all members (super admin only)
 */
export const getMembers = async (): Promise<MemberWithEmail[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Check if current user is super admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData?.role !== 'super_admin') return [];

  // Get all users with roles using service role client for user emails
  const { data: roles } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: true });

  if (!roles) return [];

  // We need to get emails from auth.users - this requires service role
  const serviceClient = await createServiceClient();

  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  const userEmailMap = new Map(
    authUsers?.users?.map(u => [u.id, u.email || 'No email']) || []
  );

  return roles.map(r => ({
    id: r.id,
    user_id: r.user_id,
    role: r.role as Role,
    email: userEmailMap.get(r.user_id) || 'Unknown',
    created_at: r.created_at,
  }));
};

/**
 * Add a member by email (super admin only)
 */
export const addMember = async (email: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Check if current user is super admin
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Only super admin can add members' };
  }

  // Find user by email using service role
  const serviceClient = await createServiceClient();

  const { data: authUsers } = await serviceClient.auth.admin.listUsers();
  const targetUser = authUsers?.users?.find(u => u.email === email);

  if (!targetUser) {
    return { success: false, error: 'User not found. Create the user in Supabase Dashboard first.' };
  }

  // Check if user already has a role
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', targetUser.id)
    .single();

  if (existingRole) {
    return { success: false, error: 'User already has a role assigned' };
  }

  // Add member role
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: targetUser.id,
      role: 'member',
    });

  if (error) {
    console.error('Error adding member:', error);
    return { success: false, error: 'Failed to add member' };
  }

  revalidatePath('/admin/members');
  return { success: true };
};

/**
 * Remove a member (super admin only)
 */
export const removeMember = async (userRoleId: string): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Only super admin can remove members' };
  }

  // Get the role to check it's not the super admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('id', userRoleId)
    .single();

  if (!roleData) {
    return { success: false, error: 'Role not found' };
  }

  if (roleData.user_id === user.id) {
    return { success: false, error: 'Cannot remove your own role' };
  }

  // Delete the role
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', userRoleId);

  if (error) {
    console.error('Error removing member:', error);
    return { success: false, error: 'Failed to remove member' };
  }

  revalidatePath('/admin/members');
  return { success: true };
};

/**
 * Get shared API keys for current user (member view)
 */
export const getSharedKeysForMember = async (): Promise<SharedKeyWithProvider[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shared_keys_with_provider')
    .select('*')
    .order('tier_sort_order', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching shared keys:', error);
    return [];
  }

  return (data as SharedKeyWithProvider[]) || [];
};

/**
 * Share an API key with a member (super admin only)
 */
export const shareApiKey = async (
  apiKeyId: string,
  memberUserId: string
): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Only super admin can share API keys' };
  }

  // Verify the API key belongs to the current user
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id')
    .eq('id', apiKeyId)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .single();

  if (!apiKey) {
    return { success: false, error: 'API key not found or not owned by you' };
  }

  // Check if already shared
  const { data: existingShare } = await supabase
    .from('shared_api_keys')
    .select('id')
    .eq('api_key_id', apiKeyId)
    .eq('shared_with_user_id', memberUserId)
    .single();

  if (existingShare) {
    return { success: false, error: 'API key already shared with this member' };
  }

  // Create the share
  const { error } = await supabase
    .from('shared_api_keys')
    .insert({
      api_key_id: apiKeyId,
      shared_with_user_id: memberUserId,
      shared_by_user_id: user.id,
    });

  if (error) {
    console.error('Error sharing API key:', error);
    return { success: false, error: 'Failed to share API key' };
  }

  revalidatePath('/admin/sharing');
  return { success: true };
};

/**
 * Unshare an API key from a member (super admin only)
 */
export const unshareApiKey = async (
  apiKeyId: string,
  memberUserId: string
): Promise<ActionResult> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Only super admin can unshare API keys' };
  }

  const { error } = await supabase
    .from('shared_api_keys')
    .delete()
    .eq('api_key_id', apiKeyId)
    .eq('shared_with_user_id', memberUserId)
    .eq('shared_by_user_id', user.id);

  if (error) {
    console.error('Error unsharing API key:', error);
    return { success: false, error: 'Failed to unshare API key' };
  }

  revalidatePath('/admin/sharing');
  return { success: true };
};

/**
 * Get all sharing info for admin view (API keys grouped by provider)
 */
export const getSharingInfo = async (): Promise<{
  providers: {
    id: string;
    name: string;
    apiKeys: ApiKeyWithProvider[];
  }[];
  members: { id: string; email: string }[];
}> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { providers: [], members: [] };

  const isAdmin = await isSuperAdmin();
  if (!isAdmin) return { providers: [], members: [] };

  // Get all providers owned by admin
  const { data: providers } = await supabase
    .from('providers')
    .select('id, name')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('name');

  // Get all API keys owned by admin
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, label, key_prefix, provider_id')
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Get all shares
  const { data: shares } = await supabase
    .from('shared_api_keys')
    .select('api_key_id, shared_with_user_id')
    .eq('shared_by_user_id', user.id);

  // Get member emails
  const serviceClient = await createServiceClient();
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  // Get member role users only
  const { data: memberRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'member');

  const memberUserIds = new Set(memberRoles?.map(r => r.user_id) || []);

  const members = authUsers?.users
    ?.filter(u => memberUserIds.has(u.id))
    .map(u => ({ id: u.id, email: u.email || 'No email' })) || [];

  // Build share map: api_key_id -> list of user_ids shared with
  const shareMap = new Map<string, string[]>();
  shares?.forEach(s => {
    const existing = shareMap.get(s.api_key_id) || [];
    existing.push(s.shared_with_user_id);
    shareMap.set(s.api_key_id, existing);
  });

  // Build provider name map
  const providerNameMap = new Map(
    providers?.map(p => [p.id, p.name]) || []
  );

  // Group API keys by provider
  const providerKeysMap = new Map<string, ApiKeyWithProvider[]>();
  apiKeys?.forEach(key => {
    const providerKeys = providerKeysMap.get(key.provider_id) || [];
    providerKeys.push({
      id: key.id,
      label: key.label,
      key_prefix: key.key_prefix,
      provider_id: key.provider_id,
      provider_name: providerNameMap.get(key.provider_id) || 'Unknown',
      sharedWith: shareMap.get(key.id) || [],
    });
    providerKeysMap.set(key.provider_id, providerKeys);
  });

  // Build final providers array
  const providersWithKeys = providers
    ?.filter(p => providerKeysMap.has(p.id))
    .map(p => ({
      id: p.id,
      name: p.name,
      apiKeys: providerKeysMap.get(p.id) || [],
    })) || [];

  return { providers: providersWithKeys, members };
};
