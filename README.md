# 🌸 Hành trình 20/11 dành tặng Mẹ — Pixel Art 2D

Một mini game 2D phong cách pixel art có **bản đồ làng ngoài trời liên thông** và các cảnh trong nhà/trường riêng biệt, kể hành trình chúc mừng mẹ nhân ngày Nhà giáo Việt Nam 20/11. Hình ảnh được vẽ trực tiếp bằng Canvas 2D ở độ phân giải nội bộ 768px với pixel nhỏ, tán lá nhiều lớp, hoa, sỏi, mái ngói và đường lát chi tiết kiểu game RPG, **không cần Three.js, WebGL, mô hình 3D, HDRI/PBR, texture 4K hay build AAA**.

## Bản đồ ngoài trời và cách chuyển cảnh

- **Trường học (trái bản đồ):** Chọn bảng Trường học, nhân vật tự đi tới trường. Game chuyển từ bản đồ chung sang cảnh cổng trường và lớp học.
- **Đi bằng xe (giữa bản đồ):** Sau khi đọc 25 lời chúc và tan lớp, trở lại bản đồ. Chọn bảng Đi bằng xe: nhân vật đi tới xe, ô tô chạy qua tuyến đường về nhà.
- **Nhà của mẹ (phải bản đồ):** Khi xe đến nơi, chọn bảng Nhà của mẹ để mở phòng khách, gặp bố và hai con rồi đi tới cây điều ước.
- **Nút BẢN ĐỒ:** Trong các cảnh trường và nhà có thể trở lại bản đồ ngoài trời. Các điểm kế tiếp mở khóa theo trình tự câu chuyện.
- Các dấu chỉ địa điểm được đặt lên cùng một bản đồ rừng pixel chi tiết; cảnh ngoài trời được giữ liên tục thay vì thay ảnh ở từng bước di chuyển.

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
- Canvas 2D tại 768px chiều ngang; các nét raster chi tiết thường chỉ 1–3px, phóng to bằng image-rendering: pixelated.
- Các cảnh chi tiết được vẽ một lần và lưu vào canvas tạm để giảm chi phí render mỗi khung hình.
- Thẩm mỹ cozy fantasy / RPG pixel art nhỏ, không dùng ảnh photoreal hoặc khối pixel to.
- Không thư viện ngoài, không tải texture, không cần npm hoặc bundler.
- Hỗ trợ màn hình desktop và điện thoại, chuột và chạm.
- Có tùy chọn giảm chuyển động theo hệ điều hành.

## Chạy local

Dùng một static server vì trò chơi import ES Modules:

    python -m http.server 8000

Truy cập http://localhost:8000 trong trình duyệt, hoặc dùng VS Code Live Server.

## Điều khiển

- Chạm/click địa điểm đang sáng trên bản đồ (Trường học → Đi bằng xe → Nhà của mẹ), hoặc bấm nút nhiệm vụ/phím mũi tên phải (→).
- Khi đến trường, game chuyển sang cảnh riêng của trường và lớp học. Mở và đọc 25 tấm thiệp, sau đó chọn **Tan lớp · Về nhà**.
- Ở nhà, tiếp tục gặp bố và hai con trước khi đến cây điều ước, chạm/bấm những bông hoa để hiện lời chúc.
- Chọn **Chơi lại** để bắt đầu từ đầu.

## Tùy chỉnh

- Lời chúc và hội thoại: src/config.js.
- Bản đồ ngoài trời, cây cối, nhà, xe, tuyến đường, cảnh riêng, nhân vật pixel và cây điều ước: src/fine-pixel-art.js.
- Điều khiển map hub, đường di chuyển, mở khóa địa điểm, chuyển cảnh và hội thoại: src/pixel-game.js.
- Màu sắc, giao diện pixel và responsive: src/styles.css.
- Trang HTML: index.html.

Những nguồn 3D cũ trong src/main.js, src/world-spec.mjs và tools/ chỉ được giữ làm tài liệu tham khảo; **không còn được chạy hoặc xuất bản**.

## GitHub Pages

Workflow .github/workflows/vendor-three.yml (tên tệp giữ lại để không làm mất workflow) giờ xuất bản bản **Pixel Art 2D** trực tiếp sang nhánh gh-pages khi cập nhật main. Nó xuất bản cả src/fine-pixel-art.js và dọn các asset 3D đã xuất bản, không tải model hay build Three.js nữa. Cần cài đặt Pages → **Deploy from a branch** → gh-pages / (root) nếu trang chưa bật.

---

Made with ❤️ for Vietnamese Teachers' Day 20/11.
