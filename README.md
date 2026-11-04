# Hành trình 20/11 · Đồ họa pixel dựng bằng mã

Toàn bộ đồ họa đang chơi được dựng bằng Canvas 2D trong `src/pixel-world.js`: con đường hoa/mây, trường THCS Cù Chính Lan, cổng và sân trường, hành lang, lớp học, 25 học sinh và bàn ghế, đường phố, Vios màu cát, nhà, phòng khách, cầu thang và cây điều ước. Bản phát hành chỉ cần JavaScript, HTML, CSS và font Việt hóa local.

## Chạy và chơi

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:8124. Đoạn mở đầu tự chạy trên đường hoa rồi hòa dần sang trường. Chạm cảnh hoặc nút hành động, hay bấm E/Enter để tiếp tục. Mũi tên/WASD di chuyển trong vùng sàn. Nhận 25 lời chúc ở lớp, lên xe về nhà, gặp bố và hai con, lên tầng cao nhất đọc 24 điều ước. Anh trai không đeo kính; em trai đeo kính đen. Giao diện giữ các tương tác theo ngữ cảnh và lời thoại.

## Cấu trúc đồ họa

- `pixel-world.js` tạo danh sách vật thể cho từng cảnh, sắp theo chiều sâu để vẽ người, bàn, đồ đạc đúng lớp. Học sinh là 25 nhân vật riêng, không nằm trong tranh nền. Vật liệu gỗ, gạch, cửa sổ, lá và hoa được vẽ bằng các điểm/khối pixel ổn định.
- Nhân vật có đầu, tóc, mặt, kính, thân, áo, tay, hông, chân và giày. Khớp tay/chân thay đổi theo quãng đường đi; nhân vật đứng giữ vị trí chân. Học sinh và gia đình có cử động chào. Chi tiết nhận diện gia đình được cách điệu qua tóc, kính và trang phục.
- Xe Vios là hình học pixel ghép thân, kính, cửa mở, bánh quay, đèn và biển số theo nội dung người dùng. Nhà có mái hiên xanh và sân ô xanh–xám; trường giữ tên và màu cổng vàng/trụ đỏ.
- `scene-layout.js` quản lý tọa độ chân, vùng sàn, tỷ lệ theo chiều sâu và các đường đi. `pixel-game.js` điều khiển câu chuyện và hòa cảnh mở đầu. Font Be Vietnam Pro có dấu tiếng Việt, giấy phép OFL kèm theo.
- Canvas 836×470 phóng theo pixel gần nhất. Các ảnh minh họa của các phiên bản trước không nằm trong luồng tải hoặc bản phát hành hiện tại.

## Kiểm thử

```sh
npx playwright install chromium
npm test
```

Playwright chặn toàn bộ yêu cầu ảnh minh họa khi đi hết hành trình, kiểm tra 25 học sinh trong dữ liệu cảnh, 25 thiệp/24 điều ước, mở đầu và hòa cảnh, font, mobile và vùng sàn. Ảnh QA ở `test-results/`. Workflow PR kiểm thử trước; khi cập nhật main, gh-pages nhận mã và font, không đóng gói thư viện tranh PNG.
