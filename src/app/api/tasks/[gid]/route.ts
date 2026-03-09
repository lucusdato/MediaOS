import { NextResponse } from 'next/server';
import { getTaskDetail, getTaskComments } from '@/lib/asana';
import { logger } from '@/lib/logger';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gid: string }> }
) {
  const { gid } = await params;
  try {
    const [detail, comments] = await Promise.all([
      getTaskDetail(gid),
      getTaskComments(gid),
    ]);

    return NextResponse.json({
      notes: detail.notes,
      permalink_url: detail.permalink_url,
      comments: comments.map((c) => ({
        gid: c.gid,
        text: c.text,
        author: c.created_by?.name ?? 'Unknown',
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch task detail', { gid, error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch task detail' },
      { status: 500 }
    );
  }
}
