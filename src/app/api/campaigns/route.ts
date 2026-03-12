import { NextResponse } from 'next/server';
import { getCampaignData, getPortfolioProjects } from '@/lib/asana';
import { logger } from '@/lib/logger';

const PORTFOLIO_GID = '1208962792886843'; // Foods & Wellbeing

export async function GET() {
  try {
    const projects = await getPortfolioProjects(PORTFOLIO_GID);

    const campaigns = await Promise.all(
      projects.map((p) => getCampaignData(p.gid))
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
