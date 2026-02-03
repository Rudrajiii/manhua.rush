"use client";
import { usePathname } from 'next/navigation';

export default function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReaderPage = pathname?.startsWith('/reader');

  if (isReaderPage) {
    return <>{children}</>;
  }

  return <main className="content-wrapper">{children}</main>;
}
