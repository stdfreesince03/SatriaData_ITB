"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default function InsightsPage({ initialSlug = null, onBack = () => {} }) {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);

    useEffect(() => {
        // Load manifest from /public
        fetch("/insights/manifest.json")
            .then(r => r.json())
            .then(data => {
                const list = data?.items || [];
                setItems(list);
                const first = initialSlug
                    ? list.find(x => x.slug === initialSlug) || list[0]
                    : list[0];
                setActive(first || null);
            })
            .catch(() => setItems([]));
    }, [initialSlug]);

    const idx = useMemo(
        () => (active ? items.findIndex(x => x.slug === active.slug) : -1),
        [active, items]
    );

    const goNext = () => {
        if (!items.length) return;
        setActive(items[(idx + 1) % items.length]);
    };
    const goPrev = () => {
        if (!items.length) return;
        setActive(items[(idx - 1 + items.length) % items.length]);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Kembali</span>
                    </button>
                    <div className="ml-auto text-sm text-gray-500">
                        {idx >= 0 && items.length > 0 ? `Insight ${idx + 1} / ${items.length}` : ""}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left nav */}
                <aside className="lg:col-span-1">
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b">
                            <h2 className="text-sm font-semibold text-gray-900">Daftar Insight</h2>
                        </div>
                        <nav className="divide-y">
                            {items.map(item => (
                                <button
                                    key={item.slug}
                                    onClick={() => setActive(item)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 ${
                                        active?.slug === item.slug ? "bg-gray-50" : ""
                                    }`}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">{item.summary}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <main className="lg:col-span-3">
                    {!active ? (
                        <div className="h-64 grid place-items-center text-gray-500 border rounded-xl">
                            Memuat insight…
                        </div>
                    ) : (
                        <article className="bg-white border rounded-xl overflow-hidden">
                            <div className="p-6 border-b">
                                <h1 className="text-2xl font-semibold text-gray-900">{active.title}</h1>
                                <p className="mt-2 text-sm text-gray-600">{active.summary}</p>
                            </div>

                            <div className="p-6">
                                <div className="relative w-full overflow-hidden rounded-lg border">
                                    {/* Use next/image for optimisation; images live in /public/insights */}
                                    <Image
                                        src={active.image}
                                        alt={active.title}
                                        width={1600}
                                        height={900}
                                        className="w-full h-auto"
                                        priority
                                    />
                                </div>

                                {/* Long explanation */}
                                {active.details?.length ? (
                                    <div className="mt-6">
                                        <h3 className="text-base font-semibold text-gray-900 mb-2">Penjelasan</h3>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                                            {active.details.map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {/* Prev/Next */}
                                <div className="mt-8 flex items-center justify-between">
                                    <button
                                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                                        onClick={goPrev}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                                        onClick={goNext}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        </article>
                    )}
                </main>
            </div>
        </div>
    );
}
