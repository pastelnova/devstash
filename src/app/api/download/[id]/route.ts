import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getFromR2 } from '@/lib/r2'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const item = await prisma.item.findFirst({
    where: { id, userId: session.user.id },
    select: { fileUrl: true, fileName: true },
  })

  if (!item?.fileUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { body, contentType } = await getFromR2(item.fileUrl)

  const isImage = contentType.startsWith('image/')
  const safeName = (item.fileName ?? 'download').replace(/["\\]/g, '')
  const disposition = isImage
    ? 'inline'
    : `attachment; filename="${safeName}"`

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
