"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

type HelpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-lg overflow-y-auto border-white/10 bg-[#0f172a]/95 text-[#E2E8F0] shadow-xl backdrop-blur-sm"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl text-white"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            遊び方
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <section>
            <h2
              className="mb-2 text-xs font-medium tracking-wider text-[#818CF8]/90"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              ゲームの流れ
            </h2>
            <ol className="list-inside list-decimal space-y-2 text-[#94A3B8]">
              <li>
                <strong className="text-[#E2E8F0]">ロビー</strong>
                — 参加コードを共有し、全員が揃ったらホストが「ゲーム開始」を押します。
              </li>
              <li>
                <strong className="text-[#E2E8F0]">お題・回答</strong>
                — 表示されたお題に沿って、各自が回答を入力して送信します。
              </li>
              <li>
                <strong className="text-[#E2E8F0]">投票</strong>
                — 全員の回答が匿名で一覧表示されます。気に入った回答に1人1票（付け替え可）。
              </li>
              <li>
                <strong className="text-[#E2E8F0]">結果</strong>
                — 投票結果が発表されます。
                <span className="mt-1.5 block rounded-lg border border-[#818CF8]/30 bg-[#818CF8]/15 px-3 py-2 text-[#E2E8F0]">
                  1位の人のみ、誰が回答したかが明らかになります。
                </span>
                ホストは「次のラウンド」で続行できます。
              </li>
            </ol>
          </section>

          <section>
            <h2
              className="mb-2 text-xs font-medium tracking-wider text-[#818CF8]/90"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              ホストについて
            </h2>
            <p className="text-[#94A3B8]">
              ルームを作成した人がホストです。ゲーム開始・次のラウンドの進行はホストのみが操作できます。参加コードは画面上部の「参加コード」からコピーして共有してください。
            </p>
          </section>

          <section>
            <h2
              className="mb-2 text-xs font-medium tracking-wider text-[#818CF8]/90"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              ショートカット
            </h2>
            <p className="flex items-center gap-2 text-[#94A3B8]">
              <Kbd className="bg-white/15 text-white/90">?</Kbd>
              キーでこのヘルプを開く／閉じる
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
