"use client";

import dynamic from "next/dynamic";

const ResultScreen = dynamic(
  () => import("@/components/result-screen").then((m) => ({ default: m.ResultScreen })),
  { ssr: false }
);

/**
 * 結果発表アニメーションのモックプレビュー用ページ。
 * 開発時は /result にアクセスして演出を確認できます。
 */
export default function ResultPreviewPage() {
  return <ResultScreen />;
}
