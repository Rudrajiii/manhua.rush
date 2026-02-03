"use client";
import { usePathname } from 'next/navigation';

export default function ConditionalNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReaderPage = pathname?.startsWith('/reader');

  if (isReaderPage) {
    return null;
  }

  return <>{children}</>;
}
