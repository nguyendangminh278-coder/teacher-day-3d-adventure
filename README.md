# Hành trình Ngày Nhà giáo Việt Nam

Game pixel art dành tặng Mẹ. Phong cảnh được tạo theo ảnh tham khảo của người dùng: rừng xanh, trường mái đỏ, nhà mái vàng, suối, cầu đá, cối xay gió và bảng giấy da. Các nút và nội dung tiếng Việt là giao diện thật, không được gắn cứng vào ảnh.

## Chơi và chạy tại máy

Cần Node.js 22 trở lên:

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:8124. Không có bước build; toàn bộ ảnh và mã chạy trực tiếp từ repository, không cần CDN, WebGL hoặc API khi chơi.

- Bấm **Trường học** hoặc bảng nhiệm vụ để tự đi theo đường. Có thể dùng mũi tên/WASD và E/Enter, hoặc phím cảm ứng.
- Vào trường → hành lang → lớp học → đọc 25 lời chúc → ra cổng trường.
- Ra bản đồ → đến xe → lên xe → xem chuyến xe về nhà → vào nhà.
- Tầng 1 gặp Bố → cầu thang → tầng 2 gặp hai con → cầu thang → tầng 3 có cây điều ước.
- Chạm các bông hoa sáng trên cây để đọc 24 lời chúc. Có thể chơi lại ở cuối.
- Góc phải có nhật ký, thành tích và tùy chọn giảm chuyển động. Màn hình dọc giữ trọn bản đồ; xoay ngang để xem phong cảnh lớn hơn.

Nhà và cây điều ước được khóa trên bản đồ để bảo đảm đến trường trước và về nhà bằng xe. Cây điều ước chỉ tương tác được khi đã lên tầng 3.

## Cảnh minh họa

`assets/illustrations/village.png` là bản đồ ngoài trời. `story-atlas.png` có sáu ô: cổng trường, lớp học, đường về, tầng 1, tầng 2, sân thượng. `details-atlas.png` có bốn ô: hành lang, trước cửa nhà, điểm lên xe, cầu thang. Renderer lấy từng ô ảnh khi đến địa điểm; ảnh không tải từ dịch vụ bên ngoài.

`src/illustrated-scenes.js` quản lý hình ảnh, nhân vật, cánh hoa và điểm chạm điều ước. `src/pixel-game.js` giữ lộ trình 15 chặng. `src/config.js` chứa lời thoại và lời chúc. `src/styles.css` chứa giao diện giấy da.

Tranh được tạo bằng công cụ tạo ảnh tích hợp từ ảnh tham khảo, không phải bản sao từng pixel. Chi tiết và bố cục có điều chỉnh để nhà có ba tầng và cây điều ước nằm trên tầng cao nhất. Xem [ghi chú tài nguyên](docs/ILLUSTRATED_ASSETS.md).

## Kiểm thử và phát hành

```sh
npx playwright install chromium
npm test
```

Windows dùng Chrome; CI Linux dùng Chromium. Kiểm thử đi hết 15 chặng, kiểm tra đủ 25 thiệp, tương tác điều ước, khóa địa điểm, chuyến xe không bị bỏ qua, nút chơi lại, hộp thoại và màn hình điện thoại. Ảnh QA được lưu tại `test-results/`.

Workflow `.github/workflows/vendor-three.yml` chạy kiểm thử trước khi cập nhật `gh-pages` từ `main`; toàn bộ ảnh minh họa được xuất bản cùng mã nguồn. Nhánh thay đổi riêng không tự thay trang đang chạy.
