/**
 * Sign-path isolation test: deserializeTx + free only
 */

import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const ITERATIONS = 5000
function mb(b: number) { return (b/1024/1024).toFixed(2)+' MB' }
function mem() { const m=process.memoryUsage(); return {h:m.heapUsed,e:m.external} }
function gc() { if(typeof globalThis.gc==='function') globalThis.gc() }

// A realistic signed tx CBOR for deserialization testing
const SAMPLE_CBOR = '84a3008182582094c19acf3fc85dec3dc4217f615a75d8d3079ab34bd31a31ef0e49a3c3dc1582000182583900943c39a99c92b4c11b4db75db74c73f4aef0e72e962506b29b1b5e2b2ea62f5fa23b3e5a1b7b5c9f5d4e7a9b1c3d5e7f9a1b3c5d7e9f1a1b000f4240021a0002faf6081a00989680'

async function main() {
  console.log('=== SIGN-PATH ISOLATION: deserializeTx → free only ===\n')
  gc(); const bl = mem()
  console.log(`BASELINE: heap=${mb(bl.h)} ext=${mb(bl.e)}\n`)

  const s = Date.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const tx = CardanoWASM.FixedTransaction.from_bytes(Buffer.from(SAMPLE_CBOR, 'hex'))
    // Simulate what resolveTxHash does
    tx.transaction_hash().to_hex()
    tx.free()

    if ((i+1) % 1000 === 0) {
      const m = mem()
      console.log(`[${i+1}/${ITERATIONS}] heap=${mb(m.h)} ext=${mb(m.e)} (Δ${m.e>=bl.e?'+':''}${mb(Math.abs(m.e-bl.e))}) | ${((Date.now()-s)/1000).toFixed(1)}s`)
    }
  }

  gc(); await new Promise(r=>setTimeout(r,500)); gc()
  const f = mem(); const d = f.e - bl.e
  console.log(`\nFINAL: ext ${mb(bl.e)}→${mb(f.e)} Δ${d>=0?'+':''}${mb(Math.abs(d))}`)
  console.log(`Leak rate: ${(d/1024/ITERATIONS).toFixed(2)} KB/iter`)
  console.log(Math.abs(d) < 2*1024*1024 ? '✅ OK' : '❌ LEAK')
}

main().catch(e=>{console.error(e);process.exit(1)})
