"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { HiMenu } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="mobile-nav-wrapper" ref={menuRef}>
      <button
        className="mobile-nav-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
      >
        {open ? <IoClose size={22} /> : <HiMenu size={22} />}
      </button>

      {open && (
        <div className="mobile-nav-dropdown">
          {[
            { href: "/", label: "Home" },
            { href: "/ttp-providence", label: "View Chapters" },
            { href: "/craft?mode=dev", label: "Craft" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mobile-nav-item"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
