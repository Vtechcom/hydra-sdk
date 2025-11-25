# Hướng dẫn Build và Publish Packages

## Các bước thực hiện

1. **Kiểm tra đúng Node.js version**
   - Đảm bảo bạn đang sử dụng đúng phiên bản Node.js được chỉ định trong file `.nvmrc`.
   - Nếu bạn sử dụng `nvm`, chạy lệnh sau để chuyển đúng phiên bản:
     ```bash
     nvm use
     ```

2. **Kiểm tra xem đã cài đặt pnpm chưa**
   - Chạy lệnh sau để kiểm tra:
     ```bash
     pnpm -v
     ```
   - Nếu chưa cài đặt, bạn có thể cài đặt pnpm bằng lệnh:
     ```bash
     npm install -g pnpm
     ```

3. **Build packages**
   - Chạy lệnh:
     ```bash
     pnpm build:packages
     ```

4. **Cập nhật phiên bản và changelog**
   - Chạy lệnh:
     ```bash
     npx changeset
     ```
   - Thực hiện theo hướng dẫn để tạo changelog.

5. **Bump version**
   - Chạy lệnh:
     ```bash
     npx changeset version
     ```

6. **Publish packages**
   - Chạy lệnh:
     ```bash
     npx changeset publish
     ```

   - Đảm bảo bạn đã đăng nhập vào registry nếu cần.
