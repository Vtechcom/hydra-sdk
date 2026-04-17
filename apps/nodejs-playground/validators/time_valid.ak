use aiken/interval.{is_entirely_after}
use cardano/transaction.{OutputReference, Transaction}

pub type TimeDatum {
  deadline_timestamp: Int,
}

validator time_validator {
  spend(
    datum: Option<TimeDatum>,
    _redeemer: Data,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(d) = datum
    let Transaction { validity_range, .. } = tx
    let after_deadline = is_entirely_after(validity_range, d.deadline_timestamp)
    expect after_deadline?
    True
  }

  else(_) {
    fail
  }
}
