# 🌸 Hành trình 20/11 dành tặng Mẹ — 3D Adventure

Một landing page / mini game 3D chạy trực tiếp trên trình duyệt, kể một hành trình chúc mừng mẹ nhân ngày Nhà giáo Việt Nam 20/11.

## Trải nghiệm

- Mascot 3D “Mầm Nhỏ” xuất hiện từ cổng không gian.
- Rơi xuống khu vườn trên mây.
- Camera góc nhìn thứ 3 đi theo mascot trên con đường hoa tới trường.
- Đi qua cổng trường và hành lang vào lớp học.
- Hiển thị 25 lời chúc mẫu từ học trò.
- “Tan lớp” rồi lái xe về nhà.
- Khám phá nhà 3 tầng: bố, hai con trai và cây điều ước.
- Kết thúc bằng cây cổ thụ nở hoa, mỗi bông hoa tượng trưng cho một lời chúc.

## Công nghệ

- Three.js (ES Modules từ jsDelivr CDN)
- HTML / CSS / JavaScript thuần
- Không cần build, không cần npm, không cần backend
- Responsive desktop + mobile
- Có workflow GitHub Pages sẵn

## Chạy local

Do browser chặn ES module khi mở trực tiếp bằng `file://`, hãy chạy một static server nhỏ:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.

Hoặc dùng VS Code Live Server.

## Thay lời chúc

Sửa `src/config.js`:

- `CLASS_WISHES`: 25 lời chúc trong lớp học
- `TREE_WISHES`: lời chúc trên cây điều ước

## Deploy GitHub Pages

Workflow `.github/workflows/pages.yml` sẽ deploy toàn bộ repository lên GitHub Pages khi push vào `main`.

Vào **Settings → Pages → Source: GitHub Actions** nếu repository chưa bật Pages.

## Concept

Ảnh concept tối ưu để tham chiếu art direction nằm tại `docs/concept.jpg`.

---

Made with ❤️ for Vietnamese Teachers' Day 20/11.
