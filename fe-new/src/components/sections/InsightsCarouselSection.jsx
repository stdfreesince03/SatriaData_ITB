"use client";
import { BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function InsightsCarouselSection() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollerRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);

    // Load manifest from /public/insights/manifest.json
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/insights/manifest.json", { cache: "no-store" });
                const data = await res.json();
                if (!alive) return;

                // Basic normalization + sort by "order" if present
                const normalized = (data.items || data || []).map((d, i) => ({
                    id: d.id ?? `insight-${i}`,
                    title: d.title ?? "Insight",
                    caption: d.caption ?? "",
                    image: d.image,                       // e.g. "/insights/top_categories_by_engagement.png"
                    slug: d.slug ?? d.id ?? `insight-${i}`,
                    highlight: d.highlight ?? "",
                    order: typeof d.order === "number" ? d.order : i,
                })).sort((a, b) => a.order - b.order);

                setItems(normalized);
            } catch (e) {
                console.error("Failed to load insights manifest:", e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const scrollBy = (dir) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
    };

    const checkScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 0);
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll);
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            ro.disconnect();
        };
    }, []);

    const content = useMemo(() => {
        if (loading) {
            return (
                <div className="px-6 py-10 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-600">Loading insights…</p>
                </div>
            );
        }
        if (!items.length) {
            return (
                <div className="px-6 py-10 text-center text-gray-600">
                    No insights found. Make sure <code>/public/insights/manifest.json</code> exists and points to your images.
                </div>
            );
        }
        return (
            <div className="relative group">
                {canLeft && (
                    <button
                        onClick={() => scrollBy("left")}
                        className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-white via-white to-transparent flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Scroll left"
                    >
                        <div className="bg-white rounded-full p-1.5 shadow-md ml-2">
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </div>
                    </button>
                )}

                <div
                    ref={scrollerRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth pr-4"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {items.map((it) => (
                        <Link
                            key={it.id}
                            href={`/insights/${encodeURIComponent(it.slug)}`}
                            className="flex-shrink-0 w-80 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all"
                        >
                            <div className="relative w-80 h-44 rounded-t-xl overflow-hidden">
                                {/* local images in /public/insights */}
                                {it.image ? (
                                    <Image
                                        src={it.image}
                                        alt={it.title}
                                        fill
                                        sizes="320px"
                                        className="object-cover"
                                        priority={false}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{it.title}</h3>
                                {it.highlight && (
                                    <p className="mt-1 text-xs font-medium text-blue-700">{it.highlight}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{it.caption}</p>
                                <div className="mt-3 text-sm text-blue-600 font-medium">Open insight →</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {canRight && (
                    <button
                        onClick={() => scrollBy("right")}
                        className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-white via-white to-transparent flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Scroll right"
                    >
                        <div className="bg-white rounded-full p-1.5 shadow-md mr-2">
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </div>
                    </button>
                )}
            </div>
        );
    }, [loading, items, canLeft, canRight]);

    return (
        <section className="px-6 mt-6">
            <div className="max-w-7xl mx-auto bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-medium text-gray-900">Insights</h2>
                    </div>
                    <Link
                        href="/insights"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        See all
                    </Link>
                </div>
                {content}
            </div>
        </section>
    );
}
