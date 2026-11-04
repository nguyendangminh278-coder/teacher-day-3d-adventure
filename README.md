# 🌸 Hành trình 20/11 dành tặng Mẹ — Pixel Art 2D

Một mini game 2D phong cách pixel art, kể hành trình chúc mừng mẹ nhân ngày Nhà giáo Việt Nam 20/11. Hình ảnh được vẽ trực tiếp bằng Canvas 2D với các ô màu đơn giản, **không cần Three.js, WebGL, mô hình 3D, HDRI/PBR, texture 4K hay build AAA**.

## Hành trình 10 chặng

1. Mẹ xuất hiện bên cổng mây pixel.
2. Khu vườn hoa đầy sắc màu.
3. Con đường đến ngôi trường thân thương.
4. Cổng trường Hoa Mây.
5. Lớp học với đủ **25 lời chúc** từ học trò.
6. Chuyến xe đưa mẹ về nhà.
7. Tầng 1 — bố gửi lời chúc.
8. Tầng 2 — lời chúc của anh trai.
9. Tầng 2 — lời chúc của em trai.
10. Cây điều ước nở hoa — **chạm vào từng hoa để đọc lời chúc**.

Các đoạn hội thoại, 25 lời chúc của học trò và 24 lời chúc trên cây đều được giữ từ phiên bản trước.

## Công nghệ

- HTML / CSS / JavaScript ES Modules thuần.
- Canvas 2D, vẽ ở độ phân giải thấp và phóng to bằng image-rendering: pixelated.
- Không thư viện ngoài, không tải texture, không cần npm hoặc bundler.
- Hỗ trợ màn hình desktop và điện thoại, chuột và chạm.
- Có tùy chọn giảm chuyển động theo hệ điều hành.

## Chạy local

Dùng một static server vì trò chơi import ES Modules:

    python -m http.server 8000

Truy cập http://localhost:8000 trong trình duyệt, hoặc dùng VS Code Live Server.

## Điều khiển

- Bấm nút nhiệm vụ hoặc phím mũi tên phải (→) để chuyển chặng.
- Ở lớp học, mở và đọc 25 tấm thiệp, sau đó chọn **Tan lớp · Về nhà**.
- Ở cây điều ước, chạm/bấm vào những bông hoa để hiện lời chúc.
- Chọn **Chơi lại** để bắt đầu từ đầu.

## Tùy chỉnh

- Lời chúc và hội thoại: src/config.js.
- Cảnh, nhân vật pixel, hiệu ứng hoa và cây: src/pixel-game.js.
- Màu sắc, giao diện pixel và responsive: src/styles.css.
- Trang HTML: index.html.

Những nguồn 3D cũ trong src/main.js, src/world-spec.mjs và tools/ chỉ được giữ làm tài liệu tham khảo; **không còn được chạy hoặc xuất bản**.

## GitHub Pages

Workflow .github/workflows/vendor-three.yml (tên tệp giữ lại để không làm mất workflow) giờ xuất bản bản **Pixel Art 2D** trực tiếp sang nhánh gh-pages khi cập nhật main. Nó dọn các asset 3D đã xuất bản, không tải model hay build Three.js nữa. Cần cài đặt Pages → **Deploy from a branch** → gh-pages / (root) nếu trang chưa bật.

---

Made with ❤️ for Vietnamese Teachers' Day 20/11.
