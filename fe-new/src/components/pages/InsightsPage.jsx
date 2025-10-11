"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Tag } from "lucide-react";

export default function InsightsPage({ initialSlug = null, onBack = () => {} }) {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(null);

    useEffect(() => {
        fetch("/insights/manifest.json")
            .then((r) => r.json())
            .then((data) => {
                // Normalize keys from the manifest
                const list = (data?.items || []).map((x) => ({
                    ...x,
                    teaser: x.teaser || x.summary || "",
                    description: x.description || x.details || "",
                    tags: x.tags || [],
                }));
                setItems(list);
                const first = initialSlug
                    ? list.find((x) => x.slug === initialSlug) || list[0]
                    : list[0];
                setActive(first || null);
            })
            .catch(() => setItems([]));
    }, [initialSlug]);

    const idx = useMemo(
        () => (active ? items.findIndex((x) => x.slug === active.slug) : -1),
        [active, items]
    );

    const go = (dir) => {
        if (!items.length) return;
        const next = (idx + (dir === "next" ? 1 : -1) + items.length) % items.length;
        setActive(items[next]);
    };

    const renderDescription = (desc) => {
        if (Array.isArray(desc)) {
            return desc.map((p, i) => (
                <p key={i} className="mb-3">
                    {p}
                </p>
            ));
        }
        if (typeof desc === "string") {
            return desc
                .split(/\n\s*\n/) // split paragraphs
                .filter(Boolean)
                .map((p, i) => (
                    <p key={i} className="mb-3">
                        {p}
                    </p>
                ));
        }
        return null;
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
                        {idx >= 0 && items.length > 0
                            ? `Insight ${idx + 1} / ${items.length}`
                            : ""}
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
                            {items.map((item) => (
                                <button
                                    key={item.slug}
                                    onClick={() => setActive(item)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 ${
                                        active?.slug === item.slug ? "bg-gray-50" : ""
                                    }`}
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">{item.teaser}</p>
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
                            {/* Title + teaser */}
                            <div className="p-6 border-b">
                                <h1 className="text-2xl font-semibold text-gray-900">{active.title}</h1>
                                {active.teaser ? (
                                    <p className="mt-2 text-sm text-gray-600">{active.teaser}</p>
                                ) : null}

                                {/* Tags */}
                                {active.tags?.length ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {active.tags.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                                            >
                        <Tag className="w-3 h-3" />
                                                {t}
                      </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            {/* Image with smart sizing (contain + max height) */}
                            <div className="p-6">
                                <div
                                    className="relative w-full grid place-items-center overflow-hidden rounded-lg border bg-gray-50"
                                    style={{
                                        // keeps big images reasonable, small ones centered
                                        maxHeight: "70vh",
                                        minHeight: "320px",
                                    }}
                                >
                                    <div className="relative w-full h-full" style={{ height: "min(70vh, 720px)" }}>
                                        <Image
                                            src={active.image}
                                            alt={active.title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 960px"
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>

                                {/* Long description from manifest */}
                                {active.description ? (
                                    <div className="mt-6 prose prose-sm max-w-none prose-p:leading-relaxed">
                                        {renderDescription(active.description)}
                                    </div>
                                ) : null}

                                {/* Prev/Next */}
                                <div className="mt-8 flex items-center justify-between">
                                    <button
                                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                                        onClick={() => go("prev")}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                                        onClick={() => go("next")}
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
