# チェックインワークフロー改善

## 概要

管理者がQRコードスキャン後に手動で入場許可/拒否を判断できるよう、チェックインワークフローを改善しました。

## 変更前の動作

```
1. QRコードをスキャン
2. 自動的にチケット検証
3. 自動的に入場処理（isUsed: true）
4. 結果表示
```

**問題点：**
- 管理者の判断が介入できない
- 誤スキャンでも自動的に入場処理される
- 同じQRコードを何度もスキャンできてしまう

## 変更後の動作

```
1. QRコードをスキャン
2. チケット情報を検証・表示
3. 管理者が「入場許可」または「入場拒否」を選択
4. 入場許可の場合のみ入場処理（isUsed: true）
5. 結果表示
```

**改善点：**
✅ 管理者が目視確認してから入場処理
✅ 誤スキャンを防止
✅ 同一セッション内で同じQRコードの再スキャンを防止

## UI の変更

### 検証成功時（新規）

```
┌────────────────────────────────────┐
│ ℹ️  チケット確認                      │
├────────────────────────────────────┤
│ お名前:        山田太郎               │
│ チケット種別:   一般席（自由席）        │
│ 公演:          2025年1月1日 14:00    │
│                                    │
│ 🎫 引換券使用チケット（該当する場合）    │
│                                    │
│ ┌─────────┐  ┌─────────┐          │
│ │✓ 入場許可 │  │✗ 入場拒否 │          │
│ └─────────┘  └─────────┘          │
└────────────────────────────────────┘
```

### 入場許可後

```
┌────────────────────────────────────┐
│ ✓ 入場完了                          │
├────────────────────────────────────┤
│ お名前:        山田太郎               │
│ チケット種別:   一般席（自由席）        │
│ 公演:          2025年1月1日 14:00    │
└────────────────────────────────────┘
```

### スキャン済みコードを再スキャンした場合（新規）

```
┌────────────────────────────────────┐
│ ✗ エラー                            │
├────────────────────────────────────┤
│ このチケットは既にスキャン済みです       │
└────────────────────────────────────┘
```

## 技術的な変更

### 1. 連続スキャン防止（重要）

```typescript
// 新規追加: スキャン中フラグとステータスフラグ
const isScanningRef = useRef<boolean>(false);
const scanStatusRef = useRef<ScanStatus>('idle');

// scanStatusとscanStatusRefを同期的に更新するヘルパー
const updateScanStatus = (status: ScanStatus) => {
  setScanStatus(status);
  scanStatusRef.current = status;
};

// カメラコールバックで即座にチェック
const controls = await codeReader.decodeFromVideoDevice(
  undefined,
  videoRef.current,
  async (result) => {
    // idle状態かつスキャン中でない場合のみ処理
    if (result && !isScanningRef.current && scanStatusRef.current === 'idle') {
      isScanningRef.current = true;
      scanStatusRef.current = 'scanning';
      const code = result.getText();
      await stopCamera();
      await handleScan(code);
    }
  }
);

// handleScan終了時にリセット
isScanningRef.current = false;
```

**特徴：**
- ✅ カメラが連続でQRコードを検出しても、1回のみ処理
- ✅ `useRef`を使用して即座にロック（stateの更新待ちなし）
- ✅ `scanStatusRef`で現在のステータスを即座にチェック
- ✅ `verified`（入場許可待ち）状態では新しいスキャンをブロック
- ✅ カメラ停止時、リセット時、スキャン完了時にフラグをリセット

**重要性：**
カメラは1秒間に数十回QRコードを検出するため、このロックがないと同じコードが何十回も連続でスキャンされてしまいます。さらに、`verified`状態でもカメラのコールバックは動き続けるため、`scanStatusRef`でステータスをチェックすることで、管理者の判断待ちの間は新しいスキャンを防ぎます。

### 2. スキャン済みコード管理

```typescript
// 新規追加
const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());

// スキャン時にチェック
if (scannedCodes.has(ticketCode)) {
  setScanStatus('error');
  setErrorMessage('このチケットは既にスキャン済みです');
  return;
}

// スキャン後に追加
setScannedCodes(prev => new Set(prev).add(ticketCode));
```

**特徴：**
- セッション中のみ有効（ページリロードでリセット）
- 同じQRコードの重複スキャンを防止
- エラー時もスキャン済みに追加（誤操作防止）

### 3. ステータスフロー

```typescript
// 変更前
'idle' → 'scanning' → 'success' or 'error'

// 変更後
'idle' → 'scanning' → 'verified' → 'success' or 'idle'
                    ↘ 'error'
```

**新しいステータス：**
- `verified`: チケット検証済み、管理者の判断待ち

### 4. ハンドラー追加

```typescript
// 入場許可
const handleCheckIn = async () => {
  await adminFetch('/api/tickets/check-in', { ... });
  setScanStatus('success');
};

// 入場拒否
const handleReject = () => {
  setScanStatus('idle');
  setErrorMessage('入場を拒否しました');
};
```

### 5. コンポーネント更新

**CheckInResult.tsx:**
- `verified` 状態の UI 追加
- `onCheckIn` / `onReject` props 追加
- VIP1/VIP2 席の表示対応

## API の変更

### `/api/tickets/stats/today` - 統計情報の取得

**変更前：**
```json
{
  "count": 5,
  "tickets": [...]
}
```

**変更後：**
```json
{
  "totalCheckedIn": 5,
  "generalCheckedIn": 3,
  "reservedCheckedIn": 1,
  "vip1CheckedIn": 1,
  "vip2CheckedIn": 0
}
```

**理由：**
- フロントエンドが期待するデータ形式と一致させる
- チケット種別ごとの集計を追加
- VIP席の統計もサポート

### その他のAPI

**変更なし**

既存のAPIをそのまま使用：
- `POST /api/tickets/verify` - チケット検証
- `POST /api/tickets/check-in` - 入場処理

## 運用上の注意点

### セッション管理
- スキャン済みコードはブラウザのメモリ上で管理
- ページをリロードすると履歴がクリアされる
- 同じチケットを再確認したい場合はページをリロード

### カメラの自動再起動
- ✅ 入場許可後、3秒で自動的にリセット&カメラ再起動
- ✅ 入場拒否後、カメラを完全停止してから500ms後に再起動
- ✅ エラー発生後、3秒で自動的にカメラ再起動
- ✅ リセットボタンでカメラを完全停止してから500ms後に再起動

**重要な技術的改善：**
カメラの再起動時に以下の手順を踏むことで、カメラが真っ黒になる問題を回避：
```typescript
const handleReset = async () => {
  updateScanStatus('idle');
  // ...
  
  // カメラを完全に停止してから再起動
  if (!isManualMode) {
    await stopCamera();  // 前のストリームを完全に停止
    setTimeout(() => startCamera(), 500);  // 500ms待機してから再起動
  }
};
```

これにより、前のカメラストリームが完全に解放された後に新しいストリームが開始されます。

### 誤操作時の対応
1. **入場拒否を誤って押した場合**
   - ページをリロードして再スキャン
   
2. **入場許可を誤って押した場合**
   - データベース上で `isUsed: true` になっているため、管理者画面から手動で修正が必要

### 推奨フロー
1. QRコードをスキャン
2. 画面に表示されたチケット情報を確認
3. お客様の身分証等を確認（必要に応じて）
4. 「入場許可」をタップ
5. 「入場完了」が表示される
6. 3秒後に自動的にリセット、次のお客様のスキャンへ

## テストシナリオ

### 正常系
- ✅ 有効なチケットをスキャン → チケット情報表示
- ✅ 「入場許可」をタップ → 入場完了表示
- ✅ 音とバイブレーションが正常に動作

### 異常系
- ✅ 同じQRコードを2回スキャン → 「既にスキャン済み」エラー
- ✅ 使用済みチケット → 「使用済み」エラー表示
- ✅ 無効なチケット → エラー表示
- ✅ 「入場拒否」をタップ → リセット（再スキャン可能）

### エッジケース
- ✅ カメラモードと手動入力モードで同じ動作
- ✅ ページリロード後は同じコードも再スキャン可能
- ✅ ネットワークエラー時の適切なエラー表示

## 今後の改善案

1. **スキャン履歴の保存**
   - LocalStorage または IndexedDB を使用
   - リロード後も履歴を保持

2. **入場取り消し機能**
   - 誤って入場許可した場合の取り消し
   - 管理者権限での `isUsed: false` への変更

3. **スキャン履歴画面**
   - 現在のセッションでスキャンしたチケット一覧
   - 日時、ステータス、操作者の記録

4. **統計情報の拡充**
   - スキャン済み / 未スキャン の割合
   - 拒否されたチケット数
   - 平均スキャン時間

## 関連ファイル

- `app/admin/check-in/page.tsx` - メインロジック
- `app/admin/check-in/components/CheckInResult.tsx` - 結果表示UI
- `app/admin/check-in/types.ts` - 型定義
- `app/api/tickets/verify/route.ts` - 検証API
- `app/api/tickets/check-in/route.ts` - 入場処理API

