import React from 'react';

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="reader-layout-wrapper">
      {children}
    </div>
  );
}
