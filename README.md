# 🌸 Hành trình 20/11 dành tặng Mẹ — RPG Pixel Art

Mini game kể chuyến đi đầy yêu thương của một người mẹ làm nghề giáo. Game dùng **Canvas 2D vẽ pixel art chi tiết** và giao diện sách cổ tích lấy cảm hứng từ ảnh RPG tham khảo: tiêu đề giấy da ở góc trên trái, 3 biểu tượng ở góc trên phải, bảng chỉ đường ngay trên bản đồ, nhiệm vụ ở dưới trái và hướng dẫn điều khiển ở dưới phải.

**Không cần Three.js, WebGL, ảnh 3D/PBR hay dịch vụ ngoài.** Các cảnh được vẽ bằng raster pixel nhỏ, có phong cảnh, công trình, nhân vật và vật dụng cụ thể — không chỉ đổi chữ khi đi đến địa điểm.

## Lộ trình chính — 15 chặng (không thể bỏ qua)

1. Bản đồ làng hoa: mẹ chuẩn bị đến trường.
2. Mẹ đi bộ trên bản đồ đến cổng trường.
3. **Cảnh sân trường**: trường học, cổng, hoa và đường lát đá.
4. **Cảnh hành lang trường**: hành lang với cửa lớp và bảng chào 20/11.
5. **Cảnh trong lớp**: bàn ghế, bảng phấn, học trò và 25 lời chúc.
6. **Ra khỏi trường**: mẹ xuất hiện ngoài cổng sau khi tan lớp.
7. **Đến xe và lên xe**: mẹ quay lại bản đồ, đi tới điểm đón xe, mở cảnh lên xe.
8. **Xe chạy về nhà**: cảnh đường ô tô chạy qua làng hoa, có chuyển động.
9. **Trước cửa nhà**: xe tới nhà, mẹ bước vào.
10. **Tầng 1**: phòng khách và lời chúc của bố.
11. **Cầu thang lên tầng 2**: cảnh cầu thang riêng.
12. **Tầng 2 — Anh trai**: cảnh và lời chúc của con trai lớn.
13. **Tầng 2 — Em trai**: cảnh và lời chúc của con trai nhỏ.
14. **Cầu thang lên tầng 3**: chặng leo cầu thang cuối cùng.
15. **Tầng cao nhất — cây điều ước**: sân vườn trên tầng 3 với 24 bông hoa tương tác.

**Cây điều ước không phải lối vào độc lập trên bản đồ.** Điểm này chỉ được mở sau khi mẹ đã về nhà, gặp gia đình và lên cầu thang tới tầng cao nhất.

## Hình ảnh của các cảnh

- **Bản đồ ngoài trời:** có trường ở giữa phía trên, nhà phía trái, xe ở giữa-phải, cối xay gió và cây điều ước phía phải. Có đường mòn, suối, rừng và vườn hoa.
- **Sân trường:** ngôi trường với cửa sổ, lối vào, bảng tên, cổng hoa và sân.
- **Hành lang:** nền gạch, cửa sổ, cửa lớp, banner 20/11.
- **Lớp học:** bảng, bàn ghế và không gian đón lời chúc.
- **Xe:** điểm đón và đường về được minh họa bằng hai cảnh khác nhau.
- **Nhà:** mặt tiền, phòng khách tầng 1, không gian tầng 2, cầu thang và sân vườn trên tầng 3.

Các hình ảnh này hiện được **vẽ trực tiếp bằng mã pixel art** (những hình raster nguyên gốc), không phải ảnh 3D hoặc bộ background PNG nhân bản từ ảnh tham chiếu. Độ chi tiết sẽ khác tranh pixel được vẽ thủ công.

## Cách điều khiển

- **Desktop:** mũi tên hoặc WASD để di chuyển trên bản đồ; phím E/Enter để vào địa điểm; nút nhiệm vụ giúp nhân vật tự đi theo lối.
- **Điện thoại:** chạm bảng địa điểm, nút nhiệm vụ hoặc dùng bộ phím điều hướng ở góc dưới phải.
- **Ở lớp học:** chọn Đọc 25 lời chúc rồi Tan lớp · Ra khỏi trường.
- **Khi lên xe:** chọn Lên xe để xem cảnh xe chạy và tự tới nhà.
- **Trong nhà:** chọn nút nhiệm vụ để gặp bố và các con, lên tầng tiếp theo.
- **Ở cây điều ước:** chạm vào từng bông hoa để đọc 24 lời chúc, hoặc chơi lại.

Góc trên phải có **Thành tích**, **Nhật ký** và **Cài đặt giảm chuyển động**.

## Cấu trúc chính

- index.html: giao diện RPG.
- src/styles.css: giao diện giấy da, bảng chỉ đường, nút điều khiển và responsive.
- src/pixel-game.js: state machine và lộ trình 15 chặng, thao tác bản đồ, chuyển cảnh.
- src/fine-pixel-art.js: nền bản đồ, các cảnh riêng, nhân vật, hoa và đồ vật.
- src/config.js: nội dung 25 thiệp, 24 hoa, thoại và danh sách nhiệm vụ.

## Chạy local

Do sử dụng ES Module, hãy chạy bằng server tĩnh:

    python -m http.server 8000

Mở http://localhost:8000. Không cần npm install.

## Xuất bản

Workflow .github/workflows/vendor-three.yml (tên file giữ để tương thích với thiết lập cũ) publish các file HTML/CSS/JS cần thiết sang nhánh gh-pages khi đẩy code lên main. Bật GitHub Pages → Deploy from a branch → gh-pages / root.

---

Made with ❤️ for Vietnamese Teachers' Day 20/11.
