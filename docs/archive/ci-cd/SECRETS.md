# GitHub Secrets Setup

Guide để setup secrets cho GitHub Actions workflows.

## 🔐 Required Secrets

### Nodejs Playground Tests

Để chạy tests cho nodejs-playground, bạn cần setup các secrets sau:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `BLOCKFROST_PROVIDER_API_KEY` | Blockfrost API key cho Preprod network | `preprodXXXXXXXXXXXXXXXXXXXXXXXX` |
| `OGMIOS_PROVIDER_WS_URL` | Ogmios WebSocket URL | `ws://ogmios-rpc.example.com` |
| `OGMIOS_PROVIDER_HTTP_URL` | Ogmios HTTP URL | `https://ogmios-rpc.example.com` |

## 📝 How to Add Secrets

### Via GitHub UI:

1. Đi đến repository settings
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Nhập **Name** và **Secret value**
5. Click **Add secret**

### Via GitHub CLI:

```bash
# Set Blockfrost API Key
gh secret set BLOCKFROST_PROVIDER_API_KEY -b "preprodXXXXXXXXXXXXXXXXXXXXXXXX"

# Set Ogmios WebSocket URL
gh secret set OGMIOS_PROVIDER_WS_URL -b "ws://ogmios-rpc.example.com"

# Set Ogmios HTTP URL
gh secret set OGMIOS_PROVIDER_HTTP_URL -b "https://ogmios-rpc.example.com"
```

### Verify Secrets:

```bash
gh secret list
```

## 🔍 Environment-Specific Secrets

Nếu bạn có nhiều environment (dev, staging, prod), có thể setup theo environment:

### 1. Create Environments:
- Settings → Environments → New environment
- Tạo environments: `development`, `staging`, `production`

### 2. Add Environment Secrets:
- Mỗi environment có thể có secrets riêng
- Ví dụ: `production` có `BLOCKFROST_PROVIDER_API_KEY` khác với `development`

### 3. Use in Workflow:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    environment: development  # or staging, production
    steps:
      # secrets sẽ được load từ environment
```

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Luôn sử dụng GitHub Secrets cho sensitive data
- ✅ Rotate secrets định kỳ
- ✅ Sử dụng environment-specific secrets khi cần
- ✅ Restrict secret access với environment protection rules
- ✅ Review secret usage trong workflows

### ❌ DON'T:
- ❌ Không commit secrets vào code
- ❌ Không log secrets trong workflows
- ❌ Không share secrets qua insecure channels
- ❌ Không hardcode secrets trong workflows
- ❌ Không sử dụng production secrets cho testing

## 📦 Secrets trong Workflows

### Basic Usage:
```yaml
steps:
  - name: Create .env file
    run: |
      echo "API_KEY=${{ secrets.API_KEY }}" > .env
```

### Multiple Secrets:
```yaml
steps:
  - name: Create .env file
    run: |
      cat << EOF > .env
      API_KEY=${{ secrets.API_KEY }}
      DATABASE_URL=${{ secrets.DATABASE_URL }}
      SECRET_TOKEN=${{ secrets.SECRET_TOKEN }}
      EOF
```

### With Environment Variables:
```yaml
steps:
  - name: Run tests
    env:
      API_KEY: ${{ secrets.API_KEY }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: npm test
```

## 🔄 Updating Secrets

### Update via GitHub UI:
1. Settings → Secrets and variables → Actions
2. Click secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**

### Update via CLI:
```bash
gh secret set SECRET_NAME -b "new-value"
```

## 🧪 Testing Secrets Locally

**⚠️ Warning**: Never commit your `.env` file to git!

### 1. Create `.env.example`:
```bash
# .env.example (commit this)
BLOCKFROST_PROVIDER_API_KEY=your-key-here
OGMIOS_PROVIDER_WS_URL=your-url-here
OGMIOS_PROVIDER_HTTP_URL=your-url-here
```

### 2. Copy and fill values:
```bash
cp .env.example .env
# Edit .env with real values (don't commit!)
```

### 3. Add to .gitignore:
```bash
# .gitignore
.env
.env.local
*.env
```

## 📊 Current Secrets Usage

### nodejs-playground-test.yml
```yaml
- name: Create .env file
  working-directory: ./apps/nodejs-playground
  run: |
    cat << EOF > .env
    BLOCKFROST_PROVIDER_API_KEY='${{ secrets.BLOCKFROST_PROVIDER_API_KEY }}'
    OGMIOS_PROVIDER_WS_URL='${{ secrets.OGMIOS_PROVIDER_WS_URL }}'
    OGMIOS_PROVIDER_HTTP_URL='${{ secrets.OGMIOS_PROVIDER_HTTP_URL }}'
    EOF
```

## 🔗 Resources

- [GitHub Docs: Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI: gh secret](https://cli.github.com/manual/gh_secret)
- [Best Practices for Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

## 🆘 Troubleshooting

### Secret not found error:
```
Error: Secret BLOCKFROST_PROVIDER_API_KEY not found
```
**Solution**: Verify secret name chính xác trong Settings → Secrets

### Permission denied:
```
Error: Resource not accessible by integration
```
**Solution**: Check workflow permissions trong Settings → Actions → General

### Secret value not working:
**Solution**: 
- Verify secret value không có trailing spaces
- Check encoding (UTF-8)
- Rotate secret và thử lại

## 📝 Checklist

Trước khi chạy workflows, đảm bảo:

- [ ] Đã add tất cả required secrets
- [ ] Secret names match exactly với workflow
- [ ] Secret values đúng format
- [ ] `.env` đã được add vào `.gitignore`
- [ ] Đã test locally với `.env` file
- [ ] Workflow có đúng permissions
