# Next.js ベストプラクティス監査レポート

Vercel React Best Practices（8カテゴリ・57ルール）に基づくコードベースのチェック結果です。

---

## 良い点（現状準拠）

| カテゴリ | 内容 |
|----------|------|
| **bundle-barrel-imports** | バレルファイル（index.ts）を使わず、必要なモジュールから直接 import している |
| **Client boundary** | `"use client"` はインタラクション・状態が必要なコンポーネントに限定されている |
| **useCallback** | `app/page.tsx`・`reaction-bar.tsx` でハンドラが依存配列付き useCallback で安定化されている |
| **Zustand** | `useGameStore((s) => s.xxx)` のセレクタで必要な state のみ購読し、不要な再レンダーを抑制している |
| **Metadata** | `app/layout.tsx` で `metadata`・`viewport`・フォントが適切に設定されている |
| **Analytics** | `@vercel/analytics` は layout で読み込まれており、初回描画後に実行される |

---

## 要対応（優先度順）

### 1. CRITICAL: ウォーターフォールの削減（async-parallel）

**対象:** `app/room/[id]/page.tsx`

- `resolveRoom(idOrShortCode)` のあと、別 `useEffect` で `getRoom(roomId)` と `getPlayersByRoom(roomId)` を呼んでいる。
- `resolveRoom` の戻り値にルーム情報が含まれるため、**resolve 直後に phase/currentQuestion をセット**し、`getRoom(roomId)` の初回呼び出しを省略できる。
- 同一ルーム内の `getRoom` と `getPlayersByRoom` はすでに並列（別 useEffect だが依存は同じ roomId）なので、並列化はできている。改善点は「resolve 結果の再利用」で往復を減らすこと。

**推奨:** resolve 成功時に `setRoom(room.id)`, `setShortCode(room.short_code ?? null)` に加え、`setRoomStatus(room.status, room.current_question ?? "")` を一度だけ呼ぶ。その後は Realtime で status 更新に任せ、初回の `getRoom(roomId)` を省略するか、Realtime の初回イベントまで待つ形にするとよい。

---

### 2. CRITICAL: next.config の TypeScript 無視

**対象:** `next.config.mjs`

```js
typescript: { ignoreBuildErrors: true }
```

- ビルドエラーを隠すだけになり、型不整合が本番に残るリスクがある。
- **推奨:** このオプションを外し、`next build` で型エラーを解消する。

---

### 3. HIGH: Supabase クライアントのシングルトン化

**対象:** `lib/supabase/client.ts`

- 各所で `createClient()` を呼ぶたびに新しいクライアントが作られている。
- ブラウザでは 1 インスタンスを共有する方が一般的で、接続・メモリの無駄を減らせる。

**推奨:** クライアントをモジュール内で 1 つだけ生成し、それを返すシングルトンにする。

---

### 4. MEDIUM: 重いコンポーネントの動的 import（bundle-dynamic-imports）

**対象:** `ResultScreen`（framer-motion を多用）、`AuroraBackground`（GlowingParticles 含む）

- `/result` や room の closeup でしか使わない `ResultScreen` は、`next/dynamic` で遅延読み込みすると初期バンドルを削減できる。
- `AuroraBackground` はトップ・ルームで使うため、必須ならそのままでも可。必要に応じて `dynamic(..., { ssr: false })` でクライアントのみ読み込みも検討可。

**推奨:** `ResultScreen` を `next/dynamic` でラップし、表示が必要なルート/フェーズでだけ読み込む。

---

### 5. MEDIUM: result-screen 内の Variants のホイスト（rendering-hoist-jsx）

**対象:** `components/result-screen.tsx`

- `pulseVariants`, `containerVariants`, `lowerCardVariants`, `placeholderShakeVariants`, `authorRevealVariants`, `lowerAuthorRevealVariants` がコンポーネント内で定義されている。
- 毎レンダーで新しいオブジェクトが作られ、framer-motion の比較コストが増える。

**推奨:** これらをコンポーネント外（モジュールスコープ）に移動する。

---

### 6. MEDIUM: ルックアップの Set 化（js-set-map-lookups）

**対象:** `lib/questions.ts`

- `usedIds.includes(item.id)` は配列の線形探索 O(n)。お題数が増えると無駄が増える。

**推奨:** `usedIds` を `Set<string>` にし、`usedSet.has(item.id)` で O(1) にする。

---

### 7. LOW: 条件付きレンダリングの三項演算子（rendering-conditional-render）

**対象:** 複数ファイルの `{error && <p>...</p>}` など

- 現状 `error` は `string | null` なので、`&&` でも 0 や空文字が誤って表示される心配は小さい。
- ベストプラクティスとしては「常に三項で明示する」と、`number` の 0 などを表示したいケースとの混同を防げる。

**推奨:** 重要度は低いが、`{error ? <p>...</p> : null}` に寄せると一貫する。

---

## 修正の適用状況

- [x] 1. ルームページの resolve 結果で phase をセットし getRoom 初回往復を省略（ウォーターフォール削減）
- [x] 2. next.config の ignoreBuildErrors 削除（型エラー解消済み・ストアの setRoom(null) 型対応）
- [x] 3. Supabase client のシングルトン化
- [x] 4. ResultScreen の next/dynamic 化（/result ページ）
- [x] 5. result-screen の Variants をモジュールスコープへ移動
- [x] 6. questions の usedIds を Set 対応（配列も引き続き受け付け）
- [x] 7. 条件付きレンダリングを三項演算子に統一（app/page, app/room, result-screen, answer-card）

---

*監査基準: Vercel React Best Practices (vercel-react-best-practices skill)*
