# ホスト退室で消えない場合の Supabase 側チェック

「ホストが退出しても一覧から消えない」とき、**Supabase の設定不備**の可能性があります。

**よくある原因**: `players_delete` ポリシー（anon の DELETE 許可）が未実行のまま。  
→ 退室 API は 200 で返るが実際には 0 行しか削除されず、ホストの行が DB に残り続ける。  
**対処**: 下記「1. RLS」のポリシーを SQL Editor で実行する。

---

以下を順に確認してください。

---

## 1. RLS（Row Level Security）ポリシー

**症状**: 退室 API は 200 で返るが、実際には `players` の行が削除されていない。

**原因**: `anon` ロールで `players` の **DELETE** が許可されていないと、DELETE が 0 件になり、行が残ります。

**確認手順**:

1. Supabase ダッシュボード → **Authentication** → **Policies**（または **Table Editor** → `players` → RLS）
2. `public.players` に **DELETE** 用のポリシーがあるか確認
3. 想定: `anon` に対して `using (true)` で DELETE 許可

**修正**: プロジェクトの `supabase/schema.sql` の「3. ポリシー」を Supabase の **SQL Editor** で実行していれば、  
`players_delete` が作成されているはずです。未実行なら実行するか、手動で以下を追加:

```sql
create policy "players_delete" on public.players for delete to anon using (true);
```

---

## 2. Replication（Realtime 用）

**症状**: 退室後、**DB 上ではプレイヤー行が消えている**が、残っている人の画面だけ更新されない。

**原因**: `players` が Replication に含まれていないと、Postgres Changes（INSERT/UPDATE/DELETE）が Realtime で配信されません。アプリ側の 1 秒ポールでカバーされているはずですが、環境によっては遅延や不整合の原因になります。

**確認手順**:

1. Supabase ダッシュボード → **Database** → **Replication**
2. **public.players** が **ON** になっているか確認

**修正**: `players` を Replication の対象に含める（チェックを ON にする）。

---

## 3. 退室が DB に反映されているかの確認

**切り分け**: 「消えない」のが「DB に残っている」のか「画面だけ古い」のかを分けます。

1. ホストに「ルームを出る」を押してもらう
2. Supabase ダッシュボード → **Table Editor** → **players**
3. 該当ルームの `room_id` でフィルタし、**退室したホストの行がまだあるか**確認

- **行が残っている** → 削除が実行されていない → **RLS または API の DELETE が効いていない**（上記 1 を重点的に確認）
- **行が消えている** → 削除は成功している → **Realtime やフロントの再取得**（Replication やポーリング）の側を疑う（上記 2 やアプリのポーリング・表示ロジック）

---

## 4. 環境変数

**確認**: `.env.local` に次が正しく入っているか。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

API Route の退室処理はサーバー側の `createServerClient()` でこれらを使っており、未設定や誤りだと接続失敗や権限不足になります。

---

## まとめ

| 確認項目           | 影響 |
|--------------------|------|
| RLS で anon の DELETE 許可 | ここが無いと退室しても行が消えず「消えない」原因になりやすい |
| Replication で players ON | Realtime で即反映。OFF でも 1 秒ポールで遅れては更新される想定 |
| Table Editor で行の有無   | 「DB では消えているか」の切り分けに必須 |

まずは **3** で「退室後に `players` の行が消えているか」を確認し、  
- 消えていない → **1（RLS）** と環境変数を確認  
- 消えている → **2（Replication）** とアプリのポーリング・表示を確認  
すると原因を絞り込みやすいです。
