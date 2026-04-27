# Node.js Playground - Cardano WASM Integration

This playground demonstrates the automatic environment detection feature of `@hydra-sdk/cardano-wasm`.

## Features Demonstrated

1. **Automatic Environment Detection**: The package automatically uses `@emurgo/cardano-serialization-lib-nodejs` when run in Node.js
2. **Multiple Import Methods**: CommonJS and ES Module support
3. **Workspace Integration**: Works seamlessly with pnpm workspaces
4. **Mathematical Operations**: BigNum arithmetic operations work correctly

## Running the Tests

```bash
# Run all tests (recommended)
pnpm test:all

# Run basic functionality tests
pnpm start

# Run environment detection test
pnpm test:env

# Run TypeScript file directly
pnpm dev

# Build and run
pnpm build && node dist/index.mjs
```

## Test Files

- `direct-test.js` - CommonJS direct import test
- `workspace-test.mjs` - ES Module workspace dependency test  
- `environment-test.mjs` - Comprehensive environment detection test
- `src/index.ts` - TypeScript integration example

## Expected Output

All tests should show:
- ✅ CardanoWASM loaded successfully  
- ✅ BigNum functionality working with mathematical operations
- ✅ Node.js version automatically detected
- ✅ Both static and dynamic imports work
- ✅ Library consistency across import methods

This proves that the conditional exports are working correctly and the Node.js environment is automatically selecting `@emurgo/cardano-serialization-lib-nodejs` instead of the browser version.
