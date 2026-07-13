import { CardanoWASM } from "@hydra-sdk/cardano-wasm";
import {
  DatumUtils,
  Deserializer,
  TimeUtils,
  SLOT_CONFIG_NETWORK,
  AppWallet,
  NETWORK_ID,
  ProviderUtils,
  Converter,
} from "@hydra-sdk/core";
import { TxBuilder } from "@hydra-sdk/transaction";

const REDEEMER_TAG = {
  MINT: CardanoWASM.RedeemerTag.new_mint(),
  SPEND: CardanoWASM.RedeemerTag.new_spend(),
  CERT: CardanoWASM.RedeemerTag.new_cert(),
  REWARD: CardanoWASM.RedeemerTag.new_reward(),
  VOTE: CardanoWASM.RedeemerTag.new_vote(),
  VOTING_PROPOSAL: CardanoWASM.RedeemerTag.new_voting_proposal(),
} as const;

type RedeemerBuilder = {
  tag: keyof typeof REDEEMER_TAG;
  exUnits?: {
    mem: string;
    steps: string;
  };
};

export const isValidAddress = (
  address: string | Uint8Array,
  type: "bech32" | "hex" | "bytes" = "bech32",
): boolean => {
  // Further validation can be added here based on specific address formats
  try {
    let wasmAddr: CardanoWASM.Address | null = null;
    if (typeof address === "string") {
      if (address.length === 0) return false;
      if (type === "bech32") {
        wasmAddr = CardanoWASM.Address.from_bech32(address);
      } else if (type === "hex") {
        wasmAddr = CardanoWASM.Address.from_hex(address);
      } else {
        return false;
      }
    } else if (address instanceof Uint8Array) {
      if (address.length === 0) return false;
      wasmAddr = CardanoWASM.Address.from_bytes(address);
    } else {
      return false;
    }
    if (!wasmAddr) return false;
    return wasmAddr.is_malformed() === false;
  } catch (e) {
    return false;
  }
};

function getPubkeyHashFromAddress(address: string): string | null {
  try {
    if (!isValidAddress(address)) {
      return null;
    }
    const wasmAddr = CardanoWASM.Address.from_bech32(address);
    const paymentCred = wasmAddr.payment_cred()?.to_keyhash()?.to_hex();
    return paymentCred || null;
  } catch {
    return null;
  }
}

export const buildRedeemer = async (
  plutusData: CardanoWASM.PlutusData,
  opt: RedeemerBuilder = {
    tag: "SPEND",
  },
) => {
  return CardanoWASM.Redeemer.new(
    REDEEMER_TAG[opt.tag],
    CardanoWASM.BigNum.from_str("0"),
    plutusData,
    CardanoWASM.ExUnits.new(
      CardanoWASM.BigNum.from_str(opt.exUnits?.mem ?? "5000000"),
      CardanoWASM.BigNum.from_str(opt.exUnits?.steps ?? "500000000"),
    ),
  );
};

async function main() {
  // Collect user inputs
  const config = {
    network: "preprod" as const,
    blockfrostApiKey: "preprod2luHm2r4rVpgWsIomeLUBU6aoUaMK9Lv",
    mnemonic:
      "dilemma field gadget isolate admit adapt health clog empower laundry play cactus film menu cloth move seek hollow song cruel angry brass list primary",
    validatorAddress: "addr_test1wrjhn97fg53euu6u6prh5z9vplz0daca9tpwd5sehz2vuxqk6jzvn",
    cborHexScript: "59031659031301010033322229800aba2aba1aba0aab9faab9eaab9dab9a9bae0049bae0039bae002488888888896600264653001300b00198059806000cdc3a4005300b0024888966002600460166ea800e2653001301000198081808800cdc3a40009112cc004c004c03cdd5004456600260206ea80222b30013001300f3754005132332259800980218091baa002899912cc004cdc79bae30023015375400666e280480462b30015980099b8848000dd69800980a9baa003899b89375a6002602a6ea800d208080b4ccd4dfc6038a50404d159800992cc004c01cc054dd5000c4cdc39b8d375c6032602c6ea800520388a5040506030602a6ea8c060c054dd5001c56600266e1cc9660026018602a6ea80062900044dd6980c980b1baa001405064b3001300c3015375400314c103d87a8000899198008009bab301a3017375400444b30010018a6103d87a8000899192cc004cdc880b000c56600266e3c0580062601466038603400497ae08a60103d87a80004061133004004301e00340606eb8c060004c06c0050192028323300100137566006602c6ea8c00cc058dd5180c980b1baa0052259800800c530103d87a8000899192cc004cdc880b000c56600266e3c0580062601266036603200497ae08a60103d87a8000405d133004004301d003405c6eb8c05c004c0680050181bad300130153754007132330010013758603260346034603460346034603460346034602c6ea802c896600200314a115980099b8f375c603400202514a3133002002301b001405480c22941013452820268a50404d14a080988c05cc0600048c05cc060c0600062c8088c8cc004004dd6180a98091baa0072259800800c5300103d87a80008992cc004cdd7980b980a1baa001007898021980b000a5eb8226600600660300048090c058005014180a18089baa003374a900045900e45901145900e0c030dd5001c5282014180580098031baa00b8a4d1365640104c11e581cc69b981db7a65e339a6d783755f85a2e03afa1cece9714c55fe4c913004c0105445553444d004c011e581c6bc787c1d7909620c60275d10da846cd448d710ce1acc1bd8b8cd4350001",
    inputAddress: "addr_test1qp4u0p7p67gfvgxxqf6azrdggmx5frt3pns6esda3wxdgd0kkvz0uzqnznqa7h7sl9hcanu3fm2wv3lvf60vy5fntnpq05s83p",
    outputAddress: "addr_test1qp4u0p7p67gfvgxxqf6azrdggmx5frt3pns6esda3wxdgd0kkvz0uzqnznqa7h7sl9hcanu3fm2wv3lvf60vy5fntnpq05s83p",
  };

  const blockfrostProvider = new ProviderUtils.BlockfrostProvider({
    apiKey: config.blockfrostApiKey,
    network: config.network,
  });
  const txBuilder = new TxBuilder();

  const mnemonic = config.mnemonic;
  const mnemonicWords = mnemonic.trim().split(/\s+/);
  const wallet = new AppWallet({
    networkId:
      NETWORK_ID[config.network.toUpperCase() as keyof typeof NETWORK_ID],
    key: {
      type: "mnemonic",
      words: mnemonicWords,
    },
    fetcher: blockfrostProvider.fetcher,
    submitter: blockfrostProvider.submitter,
  });

  const utxos = await wallet.queryUTxOs(config.inputAddress);
  const utxoValidators = await blockfrostProvider.fetcher.fetchAddressUTxOs(
    config.validatorAddress,
  );
  console.log('Utxo Validator: ', JSON.stringify(utxoValidators, null, 2));
  const txHashV = 'f134975c0d1c3ef413484d8bb1d19ebe57e9787b486a46856141add94a84b139';

  const scriptUTxO = utxoValidators.find(
    (u) => u.input.txHash === txHashV && u.input.outputIndex === Number(0),
  );

  if (!scriptUTxO) {
    throw new Error("Script TxHash is not exists!");
  }

  const collateralUTxO = await utxos.find(
    (u) =>
      u.output.amount.length === 1 &&
      u.output.amount[0].unit === "lovelace" &&
      u.output.amount[0].quantity === "5000000",
  );

  if (!collateralUTxO) {
    throw new Error("Collateral is not exists!");
  }

  const buildRedeemerData = DatumUtils.mkConstr(0, []);
  console.log("Redeemer Data", buildRedeemerData);
  console.log("🔑 Script UTxO:", scriptUTxO);
  console.log("🔑 Utxos:", utxos);
  const slotBefore = TimeUtils.unixTimeToEnclosingSlot(
    Date.now() - 120 * 1000,
    SLOT_CONFIG_NETWORK.PREPROD,
  );
  const slotAfter = TimeUtils.unixTimeToEnclosingSlot(
    Date.now() + 60 * 1000,
    SLOT_CONFIG_NETWORK.PREPROD,
  );
  console.log("Slot Before:", slotBefore);
  console.log("Slot After:", slotAfter);
  const pubkeyHash = getPubkeyHashFromAddress(config.inputAddress);
  console.log("🔑 Recipient Pubkey Hash:", pubkeyHash);

  // Lọc bỏ UTxO trùng txHash với script (tránh conflict)
  const regularUtxos = utxos.filter(
    (u) => u.input.txHash !== txHashV,
  );

  const txUnlock = await txBuilder
    .setInputs(regularUtxos)
    .txIn(
      scriptUTxO.input.txHash,
      scriptUTxO.input.outputIndex,
      scriptUTxO.output.amount,
      scriptUTxO.output.address,
    )
    .txInScript(config.cborHexScript, 'V3')
    // .txInInlineDatum(scriptUTxO.output.inlineDatum!)
    .txInRedeemerValue(await buildRedeemer(buildRedeemerData))
    .txInCollateral(
      collateralUTxO.input.txHash,
      collateralUTxO.input.outputIndex,
      collateralUTxO.output.amount,
      collateralUTxO.output.address,
    )
    .addOutput({
      address: config.outputAddress,
      amount: scriptUTxO.output.amount,
    })
    .changeAddress(config.inputAddress)
    .requiredSignerHash(pubkeyHash!)
    .setFee("1500000")
    .invalidBefore(slotBefore)
    .invalidAfter(slotAfter)
    .complete();

  console.log("🔑 Unlocking Transaction:", txUnlock.to_hex());
  const signedCbor = await wallet.signTx(txUnlock.to_hex());
  console.log("🔑 Transaction ID:", signedCbor);
  const txHash = await wallet.submitTx(signedCbor);
  console.log("🔑 Transaction:", txHash);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
