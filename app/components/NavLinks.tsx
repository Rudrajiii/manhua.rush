"use client";
import React from "react";
import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/ttp-providence", label: "Series" },
  { href: "/craft?mode=dev", label: "Craft" },
];

/**
 * Desktop breadcrumb nav links.
 * Visual loading feedback is handled by the global TopLoader bar.
 */
export default function NavLinks() {
  return (
    <ul className="breadcrumb" role="list">
      {links.map((link, i) => (
        <React.Fragment key={link.href}>
          {i > 0 && <span>/</span>}
          <li>
            <Link className="nav-link" href={link.href}>
              {link.label}
            </Link>
          </li>
        </React.Fragment>
      ))}
    </ul>
  );
}
