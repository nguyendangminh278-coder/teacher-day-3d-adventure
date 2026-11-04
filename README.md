# Một ngày cùng mẹ · Hành trình 20/11

Câu chuyện pixel art bắt đầu **ngay tại cổng trường**, theo thứ tự thời gian: vào trường → hành lang → lớp học và 25 lời chúc → ra trường → lên xe → xe chạy về nhà → vào nhà → tầng 1 → cầu thang → tầng 2 gặp hai con → cầu thang → cây điều ước ở tầng cao nhất.

Có 13 chặng. Thanh lộ trình thể hiện những phần đã đi qua; không có bản đồ gom các địa điểm hay nút nhảy đến tương lai. Giờ hiển thị là giờ kể chuyện minh họa, không phải thời khóa biểu thực tế.

## Chạy

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:8124. Bấm nút hành động hoặc phím E/Enter. Nhân vật thực hiện đường đi trong cảnh hiện tại trước khi sang cảnh tiếp theo. Mũi tên/WASD hoặc nút cảm ứng giúp di chuyển nhân vật. Khi mở bảng thiệp hoặc nhật ký, chuyển động tạm dừng.

## Hình ảnh và chuyển động

- Cổng trường được tạo từ mẫu THCS Cù Chính Lan tại Thanh Hóa do người dùng gửi trên Maps: vòm vàng, trụ đỏ, cổng sắt đen, cờ nhiều màu. Nhà lấy cảm hứng từ mặt tiền trong liên kết riêng người dùng cung cấp: mái hiên xanh, cửa gỗ, cột màu nâu đỏ, sân ô xanh–xám. Ảnh đường phố xem được ghi tháng 6/2017; tranh là mô phỏng nghệ thuật, không phải hồ sơ hiện trạng hay bản vẽ kiến trúc.
- Sprite mẹ có tám tư thế bước chân và hai hướng nhìn. Xe có ảnh cửa mở/đóng và di chuyển thật qua đường phố. Đường vào cổng, cửa lớp, cửa nhà và hai cầu thang được diễn hoạt theo tọa độ và tỷ lệ xa/gần.
- Không dùng chớp sáng, nhấp nháy, nhịp phát sáng, hạt sáng hay hiệu ứng trắng khi chuyển cảnh. Cài đặt cho phép rút ngắn thời gian hành động.
- Font **Be Vietnam Pro** Regular/Bold lưu local, đầy đủ dấu tiếng Việt, giấy phép OFL đi kèm trong assets/fonts/OFL.txt.
- Ảnh tạo bằng công cụ image_gen tích hợp. Các ảnh gốc Maps chỉ được xem làm mẫu, không đưa vào bản phát hành. Nội thất và cây điều ước là tưởng tượng theo câu chuyện.

## Kiểm thử

```sh
npx playwright install chromium
npm test
```

Playwright kiểm tra điểm bắt đầu là trường, nhân vật đổi vị trí khi bước vào, chuyến xe không bị bỏ qua, cầu thang, 25 thiệp, 24 điều ước, chơi lại, font local và không có CSS animation nhấp nháy; đồng thời kiểm tra màn hình dọc/ngang. Ảnh ở test-results/. Workflow chạy trên PR và xuất bản gh-pages sau khi cập nhật main.


## Cập nhật gia đình và tỷ lệ

Xe là Toyota Vios màu cát, có ảnh cửa mở/đóng và góc nhìn sau ở trước nhà. Biển số theo nội dung người dùng được vẽ bằng font thật. Mẹ, bố và hai con là sprite riêng theo bộ ảnh gia đình mới, không nằm cố định trong nền phòng.

`src/scene-layout.js` dùng tọa độ chân, vùng sàn hợp lệ, tỷ lệ theo chiều sâu và đường đi theo quãng đường. Nhân vật được chặn khỏi vùng đồ đạc; khi bắt đầu hành động sau khi di chuyển tay, đường đi bắt đầu ngay từ vị trí hiện tại. Kiểm thử bổ sung lấy mẫu toàn bộ đường đi để phát hiện đoạn ra ngoài sàn.
