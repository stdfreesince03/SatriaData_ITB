"use client";
import { useRouter } from "next/navigation";
import InsightsPage from "@/components/InsightsPage"; // adjust import path if needed

export default function Page() {
    const router = useRouter();
    return <InsightsPage onBack={() => router.push("/")} />;
}
