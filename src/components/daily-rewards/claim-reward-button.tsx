'use client';

import { useState } from 'react';
import { claimDailyReward } from '@/actions/providers';
import { Button } from '@/components/ui/button';
import { Gift, Check } from 'lucide-react';

interface ClaimRewardButtonProps {
  providerId: string;
}

export const ClaimRewardButton = ({ providerId }: ClaimRewardButtonProps) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    const result = await claimDailyReward(providerId);
    setClaiming(false);

    if (result.success) {
      setClaimed(true);
    }
  };

  if (claimed) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4 text-green-600" />
        Claimed
      </Button>
    );
  }

  return (
    <Button onClick={handleClaim} disabled={claiming} className="gap-2">
      <Gift className="h-4 w-4" />
      {claiming ? 'Claiming...' : 'Claim Reward'}
    </Button>
  );
};
