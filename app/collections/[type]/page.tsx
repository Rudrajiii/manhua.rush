import React from 'react';
import Link from 'next/link';
import { getAllManhua, getManhuaByType } from '@/lib/api/manhua';
import { CometCard } from '@/components/ui/comet-card';

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ p?: string }>;
};

export default async function CollectionPage({ params, searchParams }: Props) {
  const { type } = await params;
  const { p } = await searchParams;

  // Fetch manhua based on type or show all
  let items = await getAllManhua();
  
  if (type !== 'all' && (type === 'manhua' || type === 'manga' || type === 'manhwa')) {
    items = await getManhuaByType(type as 'manhua' | 'manga' | 'manhwa');
  }

  return (
    <main className="collection-page">
      <div className="collection-header">
        <h1 className="collection-title">
          {type === 'all' ? 'Trending Manhua"s' : type.charAt(0).toUpperCase() + type.slice(1)}
        </h1>
        <p className="collection-subtitle">
          Total {items.length} {items.length === 1 ? 'series' : 'series'} available
        </p>
      </div>

      <div className="cards-grid">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/collections/${item.type}/${item.slug}?n=${item.slug}`}
            className="card-link"
          >
            <CometCard>
              <div
                className="flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 md:p-2"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="flex flex-shrink-0 items-center justify-between p-2 font-sans">
                  <div className="ml-[0.9px]  truncate text-md font-bold">{item.title.slice(0, 20).trim() + "..."}</div>
                  <div className="text-md text-gray-300 opacity-50">#{item.type.toUpperCase()}</div>
                </div>
                <div className="mx-2 flex-1">
                  <div className="relative mt-2 aspect-[3/4] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      className="absolute inset-0 h-full w-full rounded-xl bg-[#000000] object-cover contrast-75"
                      alt={item.title}
                      src={item.cover || 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?q=80&w=1287&auto=format&fit=crop'}
                      style={{
                        boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                        opacity: 1,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between pl-2 pr-2 font-sans">
                  <div className="text-xs font-semibold truncate bg-[#5e5d6048] p-2 rounded-lg">Latest Ch. {item.chapters[0].chapter}</div>
                  <div className="text-xs text-gray-300 opacity-50">{item.chapters[0].createdAt.slice(0,10)}</div>
                </div>
                
              </div>
            </CometCard>
          </Link>
        ))}
      </div>
    </main>
  );
}
