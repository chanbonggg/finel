import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

type RevalidationRequest = {
  productId?: number;
  categoryId?: number;
};

function isAuthorized(request: Request): boolean {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  return Boolean(expected) && request.headers.get('x-revalidate-secret') === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RevalidationRequest = {};
  try {
    body = await request.json() as RevalidationRequest;
  } catch {
    // Product deletion and manual cache purges may legitimately send no body.
  }

  // `max` is stale-while-revalidate in Next 16. Admin mutations require the
  // next visitor to fetch fresh data, so expire the tagged entries immediately.
  revalidateTag('products', { expire: 0 });
  if (Number.isInteger(body.productId) && (body.productId as number) > 0) {
    revalidateTag(`product:${body.productId}`, { expire: 0 });
    revalidatePath(`/products/${body.productId}`);
  }
  if (Number.isInteger(body.categoryId) && (body.categoryId as number) > 0) {
    revalidateTag(`category:${body.categoryId}`, { expire: 0 });
    revalidatePath(`/products/category/${body.categoryId}`);
  }

  revalidatePath('/');
  revalidatePath('/products');
  return NextResponse.json({ revalidated: true });
}
