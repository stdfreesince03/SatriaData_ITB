"use client";
import { useRouter } from "next/navigation";
import InsightsPage from "@/components/pages/InsightsPage";


export default function Page({ params }) {
    const router = useRouter();
    const slug = decodeURIComponent(params?.slug ?? "");
    return <InsightsPage initialSlug={slug} onBack={() => router.push("/insights")} />;
}
