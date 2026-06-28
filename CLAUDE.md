# Claude Code Rules — POS Frontend

## After every implementation

1. Run `npm run build` immediately after any code change.
2. Fix every TypeScript or build error before reporting the task done.
3. Loop — keep fixing and re-running until the build exits with `✓ built`.
4. If the backend is reachable, also run the API smoke tests below to confirm
   each affected endpoint returns the expected response.

## API smoke tests (PowerShell — run after every feature that touches the backend)

```powershell
# 1. Login and capture token
$login = curl.exe -s -X POST http://192.168.1.122:4000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@pos.local","password":"admin123"}' | ConvertFrom-Json
$token = $login.data.token
$auth  = "Authorization: Bearer $token"

# 2. Health check
curl.exe -s http://192.168.1.122:4000/health

# 3. Products list
curl.exe -s -H $auth http://192.168.1.122:4000/api/v1/products?limit=3

# 4. Bank QR config
curl.exe -s -H $auth http://192.168.1.122:4000/api/v1/config/bank-qr

# 5. Generated QR image (should return image/png)
curl.exe -s -o qr_test.png -w "%{http_code} %{content_type}" `
  -H $auth "http://192.168.1.122:4000/api/v1/config/bank-qr/qrcode?amount=100.00"

# 6. Generated QR with amount
curl.exe -s -o qr_test_amount.png -w "%{http_code} %{content_type}" `
  -H $auth "http://192.168.1.122:4000/api/v1/config/bank-qr/qrcode?amount=185.00"

# 7. Create a CASH order (requires at least one product)
$firstProduct = (curl.exe -s -H $auth `
  http://192.168.1.122:4000/api/v1/products?limit=1 | ConvertFrom-Json).data.items[0]
curl.exe -s -X POST http://192.168.1.122:4000/api/v1/orders `
  -H "Content-Type: application/json" -H $auth `
  -d "{`"payment_method`":`"CASH`",`"items`":[{`"pos_product_id`":`"$($firstProduct.pos_product_id)`",`"quantity`":1}]}"

# 8. Create a BANK_QRCODE order
curl.exe -s -X POST http://192.168.1.122:4000/api/v1/orders `
  -H "Content-Type: application/json" -H $auth `
  -d "{`"payment_method`":`"BANK_QRCODE`",`"items`":[{`"pos_product_id`":`"$($firstProduct.pos_product_id)`",`"quantity`":1}]}"
```

Expected results:
- Tests 5 & 6: HTTP 200, `content_type` starts with `image/png`, files `qr_test*.png` are non-empty
- All other tests: `"status":"success"` in JSON body

## Loop rule

If any test fails: fix the root cause, rebuild, and run the failing test again. Do not mark a task complete until every test in this list returns the expected result.
