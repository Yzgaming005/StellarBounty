"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "../../components/ConnectWalletButton";

const NAV_LINKS = [
    { label: "Bounties", href: "/bounties" },
    { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <>
            <header
                className={`
          fixed top-0 inset-x-0 z-40 h-16
          transition-all duration-300
          ${scrolled
                        ? "bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/30"
                        : "bg-slate-950/70 backdrop-blur-sm border-b border-slate-800"
                    }
        `}
            >
                <nav
                    className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
                    aria-label="Main navigation"
                >
                    <Link
                        href="/"
                        className="text-lg font-semibold tracking-normal text-slate-50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
                    >
                        StellarBounty
                    </Link>

                    <ul className="hidden md:flex items-center gap-1 flex-1 ml-8" role="list">
                        {NAV_LINKS.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={`
                    relative px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                    ${isActive(href)
                                            ? "text-slate-50 bg-slate-800"
                                            : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/60"
                                        }
                  `}
                                    aria-current={isActive(href) ? "page" : undefined}
                                >
                                    {label}
                                    {isActive(href) && (
                                        <span className="absolute bottom-0.5 left-4 right-4 h-[2px] rounded-full bg-indigo-500" />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:block">
                            <ConnectWalletButton />
                        </div>

                        <button
                            onClick={() => setDrawerOpen((v) => !v)}
                            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label={drawerOpen ? "Close menu" : "Open menu"}
                            aria-expanded={drawerOpen}
                            aria-controls="mobile-drawer"
                        >
                            {drawerOpen ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            {drawerOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    aria-hidden="true"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            <aside
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
                className={`
          fixed top-16 right-0 bottom-0 z-40 w-72 md:hidden
          bg-slate-900 border-l border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}
        `}
            >
                <div className="flex flex-col h-full p-6 gap-2">
                    <nav aria-label="Mobile navigation">
                        <ul className="space-y-1" role="list">
                            {NAV_LINKS.map(({ label, href }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                      ${isActive(href)
                                                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                                : "text-slate-400 hover:text-slate-50 hover:bg-slate-800"
                                            }
                    `}
                                        aria-current={isActive(href) ? "page" : undefined}
                                        onClick={() => setDrawerOpen(false)}
                                    >
                                        {isActive(href) && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        )}
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="my-2 border-t border-slate-800" />

                    <ConnectWalletButton />
                </div>
            </aside>

            <div className="h-16" aria-hidden="true" />
        </>
    );
}