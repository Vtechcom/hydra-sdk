# Browser Cardano WASM Testing Guide

This guide demonstrates how to test the automatic environment detection of `@hydra-sdk/cardano-wasm` in a browser environment using the playground application.

## Test Environment

- **Application**: Nuxt 3 playground app
- **URL**: http://localhost:30019
- **Test Page**: http://localhost:30019/cardano-wasm-test

## Available Tests

### 1. Automated Browser Tests
Visit `/cardano-wasm-test` page and click "Run Tests" to execute:

- ✅ **Import Test**: Verifies CardanoWASM can be imported successfully
- ✅ **Environment Detection**: Confirms browser version is loaded
- ✅ **BigNum Functionality**: Tests basic BigNum creation and conversion
- ✅ **Mathematical Operations**: Tests BigNum addition operations
- ✅ **Method Discovery**: Lists available methods and classes

### 2. Interactive BigNum Calculator
- Input two numbers
- Perform addition, subtraction, multiplication, division
- See real-time results using CardanoWASM BigNum operations

### 3. Address Generator
- Generate random Cardano addresses (demo purposes)
- Shows address creation capabilities

### 4. Manual Console Testing
Use the browser console (F12) to run manual tests:

```javascript
// Test basic import and functionality
const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm')
console.log('CardanoWASM loaded:', !!CardanoWASM)
console.log('Type:', typeof CardanoWASM)

// Test BigNum operations
const bigNum1 = CardanoWASM.BigNum.from_str('1000000')
const bigNum2 = CardanoWASM.BigNum.from_str('2000000')
const sum = bigNum1.checked_add(bigNum2)
console.log(`Result: ${sum.to_str()}`)

// List available methods
console.log('Available methods:', Object.keys(CardanoWASM).length)
```

## Expected Results

### ✅ Browser Environment Detection
- Automatically uses `@emurgo/cardano-serialization-lib-browser`
- No manual configuration required
- Conditional exports working correctly

### ✅ Full Functionality
- All BigNum operations working
- Mathematical operations (add, subtract, multiply, divide)
- Address generation capabilities
- All core Cardano WASM features available

### ✅ Integration Success
- Works seamlessly with Nuxt 3
- TypeScript support
- Vite bundler compatibility
- WASM loading works correctly

## Technical Details

### Conditional Exports in Action
The `package.json` exports field ensures that:
```json
{
  "exports": {
    ".": {
      "browser": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.js"
      },
      "node": {
        "types": "./dist/index.node.d.ts", 
        "import": "./dist/index.node.mjs",
        "require": "./dist/index.node.js"
      }
    }
  }
}
```

### Browser Bundle
- Uses `dist/index.mjs` (ESM) or `dist/index.js` (CommonJS)
- Imports `@emurgo/cardano-serialization-lib-browser`
- Compatible with modern bundlers (Vite, Webpack, etc.)

### Vite Configuration
The playground uses Vite plugins for WASM support:
- `vite-plugin-wasm`
- `vite-plugin-top-level-await`
- `vite-plugin-node-polyfills`

## Comparison: Node.js vs Browser

| Feature | Node.js | Browser |
|---------|---------|---------|
| **Library** | `@emurgo/cardano-serialization-lib-nodejs` | `@emurgo/cardano-serialization-lib-browser` |
| **Bundle** | `dist/index.node.mjs` | `dist/index.mjs` |
| **Detection** | `node` condition | `browser` condition |
| **Import** | Same: `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` | Same: `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` |
| **Functionality** | Full Cardano operations | Full Cardano operations |

## Testing Commands

```bash
# Start the playground (from workspace root)
pnpm --filter hydrawallet-playground dev

# Build cardano-wasm package
pnpm --filter @hydra-sdk/cardano-wasm build

# Access the browser test
# http://localhost:30019/cardano-wasm-test
```

This demonstrates that the same import statement `import { CardanoWASM } from '@hydra-sdk/cardano-wasm'` automatically provides the correct version for each environment without any manual configuration!
