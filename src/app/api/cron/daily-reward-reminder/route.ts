import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use service role to access all users' data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get providers that require daily login and haven't been claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: unclaimedProviders, error } = await supabase
      .from('providers')
      .select('id, name, owner_id, last_reward_claimed_at')
      .eq('requires_daily_login', true)
      .is('deleted_at', null)
      .or(`last_reward_claimed_at.is.null,last_reward_claimed_at.lt.${today.toISOString()}`);

    if (error) {
      console.error('Error fetching unclaimed providers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: 500 }
      );
    }

    // Group by owner for notification purposes
    const byOwner = unclaimedProviders?.reduce((acc, provider) => {
      if (!acc[provider.owner_id]) {
        acc[provider.owner_id] = [];
      }
      acc[provider.owner_id].push(provider.name);
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Here you would send notifications (email, webhook, etc.)
    // For now, just log the unclaimed rewards
    console.log('Unclaimed daily rewards:', {
      totalProviders: unclaimedProviders?.length || 0,
      byOwner,
    });

    // You could integrate with:
    // - Resend/SendGrid for email notifications
    // - Slack webhook for team notifications
    // - Push notifications via web push

    return NextResponse.json({
      success: true,
      message: 'Daily reward reminder processed',
      stats: {
        totalUnclaimed: unclaimedProviders?.length || 0,
        uniqueUsers: Object.keys(byOwner).length,
      },
    });
  } catch (err) {
    console.error('Cron job error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
