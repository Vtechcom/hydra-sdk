# Từ điển đọc — chuỗi video Cardano & Hydra

Dùng chung cho mọi tập trong chuỗi. `lexicon.py` đọc bảng dưới đây và thay thuật ngữ trong lời đọc ngay trước khi tạo giọng. Không phiên âm thẳng trong `script.py`.

Từ ghi bằng chữ thường (ví dụ `datum`, `token`) cũng tự khớp dạng viết hoa chữ đầu khi đứng đầu câu (`Datum`, `Token`), nên không cần thêm dòng riêng cho dạng đó.

Quy ước: phiên âm viết liền, cách nhau bằng dấu cách, không dùng gạch nối. Trạng thái `đề xuất` = chờ nghe thử; `đã chốt` = chủ sản phẩm đã chọn cách đọc. Các mục `đã chốt` suy ra (cụm ghép từ từ đã chốt) vẫn cần nghe lại một lượt.

| Từ | Cách đọc | Trạng thái | Ghi chú |
|---|---|---|---|
| playground.hydrasdk.com | pờ lây gờ rao chấm hai dra ét đi cây chấm com | đề xuất | Phải đứng trước "hydrasdk.com"; lexicon tự xếp cụm dài trước |
| hydrasdk.com | hai dra ét đi cây chấm com | đã chốt (suy ra) | Ghép từ "Hydra" đã chốt |
| hydra-sdk | hai dra ét đi cây | đã chốt (suy ra) | |
| Hydra Head | hai dra hét | đã chốt (suy ra) | |
| Hydra | hai dra | đã chốt | |
| UTxO Object | iu ti ích ô óp dếch | đã chốt (suy ra) | Tên kiểu dữ liệu trong SDK |
| TxBuilder | Tê ích biu đơ | đã chốt | |
| eUTxO | i iu ti ích ô | đã chốt | UTxO mở rộng |
| UTxO | iu ti ích ô | đã chốt | |
| blockchain | Bờ lốc chên | đã chốt | |
| Bitcoin | bít coi | đã chốt | |
| Cardano | Ca đa nô | đã chốt | |
| Ethereum | E thơ rum | đã chốt | |
| ADA | a đa | đề xuất | |
| lovelace | lớp lây | đề xuất | Đơn vị nhỏ nhất, một triệu lovelace bằng một ADA |
| token | tốc cừn | đã chốt | |
| datum | đa từm | đã chốt | |
| script | scờ ríp | đã chốt | |
| JSON | dây sơn | đề xuất | |
| snapshot | xờ náp sót | đã chốt | |
| HydraBridge | cầu nối hai dra | đã chốt | Chủ sản phẩm chọn đọc bằng từ Việt; trên bảng vẫn ghi tên lớp |
| Head | hét | đề xuất | Khi đứng riêng; khớp "Hydra Head" |
| WebSocket | goép sóc kịt | đề xuất | Phương án khác: "kết nối thời gian thực" |
| redeemer | ri đi mơ | đề xuất | |
| DatumUtils | đa từm iu tiu | đề xuất | Tập 5 |
| RedeemerUtils | ri đi mơ iu tiu | đề xuất | Tập 5 |
| PlutusUtils | Plu tớt iu tiu | đề xuất | Tập 5 |
| Plutus Data | Plu tớt đây ta | đề xuất | Tập 5 |
| Plutus | Plu tớt | đề xuất | |
| core | co | đề xuất | Phương án khác: "gói lõi" |
| byte | bai | đề xuất | |
| playground | pờ lây gờ rao | đề xuất | |
| TypeScript | tai scờ ríp | đề xuất | |
| JavaScript | gia va scờ ríp | đề xuất | |
| code | cốt | đề xuất | Phương án khác: "mã" |
| AppWallet | áp oa lét | đề xuất | |
| EmbeddedWallet | em bét đít oa lét | đề xuất | |
| NFT | en ép ti | đề xuất | Tập 8; viết tắt đọc theo chữ cái tiếng Anh |
| PolicyUtils | pô li xi iu tiu | đề xuất | Tập 8 |
| hex | hếch | đề xuất | Tập 8, cụm "dạng hex" |
| Conway | Con uây | đề xuất | Tập 7, tên bản nâng cấp của Cardano |
| Ouroboros Praos | Ô rô bo rốt Pra ốt | đề xuất | Tập 9 |
| Ouroboros | Ô rô bo rốt | đề xuất | Tập 9 |
| Praos | Pra ốt | đề xuất | Tập 9 |
| slot | xờ lót | đề xuất | Tập 9 |
| epoch | ê pốc | đề xuất | Tập 9; tập 7 từng đề xuất "í pốc", thống nhất theo tập 9 |
| stake pool | xờ tếch pun | đề xuất | Tập 9; phải đứng trước "stake" và "pool", lexicon tự xếp cụm dài trước |
| stake | xờ tếch | đề xuất | Tập 9 |
| pool | pun | đề xuất | Tập 9, khi đứng riêng |
| TimeUtils | tham iu tiu | đề xuất | Tập 9 |
| CIP-30 | xíp ba mươi | đề xuất | Tập 12; phương án khác: "xê i pê ba mươi" |
| app-bridge | áp bờ rít | đề xuất | Tập 12, tên gói `@hydra-sdk/app-bridge` |
