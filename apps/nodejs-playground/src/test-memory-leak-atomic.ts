/**
 * Atomic test: create+fee Transaction repeatedly with zero internal objects
 * Isolates whether CSL Transaction.free() actually works
 */

import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

const ITERATIONS = 10000
function mb(b: number) { return (b/1024/1024).toFixed(2)+' MB' }
function mem() { const m=process.memoryUsage(); return {h:m.heapUsed,e:m.external} }
function gc() { if(typeof globalThis.gc==='function') globalThis.gc() }

async function main() {
  console.log('=== ATOMIC: TransactionBuilder.new → build_tx → free (reuse config) ===\n')
  gc(); const bl = mem()
  console.log(`BASELINE: heap=${mb(bl.h)} ext=${mb(bl.e)}\n`)

  // Pre-create shared objects (reused across iterations)
  const linearFee = CardanoWASM.LinearFee.new(
    CardanoWASM.BigNum.from_str('44'), CardanoWASM.BigNum.from_str('155381'))
  const exUnitPrices = CardanoWASM.ExUnitPrices.from_json(
    JSON.stringify({mem_price:{numerator:'0',denominator:'1'},step_price:{numerator:'0',denominator:'1'}}))
  const cfg = CardanoWASM.TransactionBuilderConfigBuilder.new()
    .fee_algo(linearFee)
    .pool_deposit(CardanoWASM.BigNum.from_str('500000000'))
    .key_deposit(CardanoWASM.BigNum.from_str('2000000'))
    .max_value_size(5000).max_tx_size(16384)
    .ex_unit_prices(exUnitPrices)
    .coins_per_utxo_byte(CardanoWASM.BigNum.from_str('4310'))
    .build()

  const addr = CardanoWASM.Address.from_bech32(
    'addr_test1wpqkx88tvs3897ljpgk7q43mguhsmq700r99ex6hpry5h8c3puxdp')
  const feeBigNum = CardanoWASM.BigNum.from_str('200000')
  const outValBigNum = CardanoWASM.BigNum.from_str('50000000')

  const s = Date.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const tb = CardanoWASM.TransactionBuilder.new(cfg)
    const val = CardanoWASM.Value.new(outValBigNum)
    const tOut = CardanoWASM.TransactionOutput.new(addr, val)
    tb.add_output(tOut)
    tb.set_fee(feeBigNum)
    const tx = await tb.build_tx_unsafe()
    tx.free()
    tb.free()

    if ((i+1) % 2000 === 0) {
      const m = mem()
      console.log(`[${i+1}/${ITERATIONS}] heap=${mb(m.h)} ext=${mb(m.e)} (Δ${((m.e-bl.e)/1024/1024)>=0?'+':''}${mb(Math.abs(m.e-bl.e))}) | ${((Date.now()-s)/1000).toFixed(1)}s`)
    }
  }

  // Free shared objects
  linearFee.free(); exUnitPrices.free(); cfg.free()
  addr.free(); feeBigNum.free(); outValBigNum.free()

  gc(); await new Promise(r=>setTimeout(r,500)); gc()
  const f = mem()
  const d = f.e - bl.e
  console.log(`\nFINAL: ext ${mb(bl.e)}→${mb(f.e)} Δ${d>=0?'+':''}${mb(Math.abs(d))}`)
  console.log(`Leak rate: ${(d/1024/ITERATIONS).toFixed(2)} KB/iter`)
  console.log(Math.abs(d) < 2*1024*1024 ? '✅ OK' : '❌ LEAK')
}

main().catch(e=>{console.error(e);process.exit(1)})
