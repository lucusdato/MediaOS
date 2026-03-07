import { NextResponse } from 'next/server';
import { getCampaignData } from '@/lib/asana';
import { logger } from '@/lib/logger';

// MVP: two hardcoded Asana project GIDs
const PROJECT_GIDS = [
  '1211551512551717', // Hellmann's Doritos Local
  '1213513346089729', // MediaOS Test Campaign
];

export async function GET() {
  try {
    const campaigns = await Promise.all(
      PROJECT_GIDS.map((gid) => getCampaignData(gid))
    );

    return NextResponse.json({ campaigns });
  } catch (error) {
    logger.error('Failed to fetch campaigns from Asana', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
