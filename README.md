# 每日任務・棒球版

給小朋友在 iPad 上勾選每天完成任務的小工具（棒球主題）。純前端 PWA，資料只存裝置本機、免費、不需上架 App Store。

## 功能

- 主畫面：用 ◀ ▶ 切換日期、點任務卡片打勾、全部完成會出現「全壘打」動畫，並以計分板與跑壘呈現進度。
- 「編輯這一天」：只調整目前顯示那一天的任務（新增／刪除／改字／排序）。
- 「每週範本」：設定每個星期幾固定的任務；只影響之後尚未被單獨編輯過的日子。
- 資料存在瀏覽器本機（localStorage），與 iCloud 無關、不佔空間；加入主畫面後可離線使用。

## 本機開發

```bash
npm test                       # 跑邏輯測試（Node 內建測試）
python3 -m http.server 8000    # 本機預覽 http://localhost:8000/
```

## 部署（GitHub Pages，免費）

1. 建立 GitHub 儲存庫並推送本專案（建議公開儲存庫；GitHub Pages 在私人庫需要付費方案。本專案不含個資，公開即可）。
2. 到 GitHub 儲存庫 → Settings → Pages → Source 選 `Deploy from a branch`，分支選 `main`、資料夾選 `/ (root)`，儲存。
3. 等候約 1 分鐘，取得網址（形如 `https://<帳號>.github.io/<儲存庫名>/`）。

## 在 iPad 上安裝

1. 用 iPad 的 **Safari** 開啟上面的網址。
2. 點底部「分享」鈕 → 選「加入主畫面」。
3. 桌面會出現「每日任務」圖示，點開即為全螢幕 App。
4. 第一次載入後即可離線使用；任務資料只存在這台 iPad。

## 之後要更新 App 時

Service Worker 會把檔案快取以支援離線。當你日後修改程式並重新部署時，請**修改 `service-worker.js` 最上方的快取名稱**（例如把 `daily-tasks-v1` 改成 `daily-tasks-v2`），這樣 iPad 才會抓到新版檔案，而不是沿用舊的快取。
