import fs from 'fs/promises';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mangadexId: string; chapter: string; file: string }> | { mangadexId?: string; chapter?: string; file?: string } }
) {
  const resolvedParams = await params;
  const mangadexId = String(resolvedParams?.mangadexId || '');
  const chapter = String(resolvedParams?.chapter || '');
  const file = String(resolvedParams?.file || '');

  if (!mangadexId || !chapter || !file) {
    return new Response('Bad Request', { status: 400 });
  }

  const productionRoot = path.resolve(process.cwd(), 'production');
  const targetPath = path.join(productionRoot, mangadexId, chapter, file);

  // prevent path traversal
  const resolved = path.resolve(targetPath);
  const resolvedRoot = path.resolve(productionRoot) + path.sep;
  if (!resolved.startsWith(resolvedRoot)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const buffer = await fs.readFile(resolved);
    const ext = path.extname(file).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.avif') contentType = 'image/avif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': contentType }
    });
  } catch (err) {
    return new Response('Not found', { status: 404 });
  }
}
