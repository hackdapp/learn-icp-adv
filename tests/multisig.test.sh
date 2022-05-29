#!/usr/local/bin/ic-repl
load "prelude.sh";

import fake = "qaa6y-5yaaa-aaaaa-aaafa-cai" as "../.dfx/local/canisters/multisig_wallet/multisig_wallet.did";
let wasm = file "../.dfx/local/canisters/multisig_wallet/multisig_wallet.wasm";

identity alice;
identity bob;
identity kitty;

// Setup initial account
identity alice;
let args = encode fake.__init_args(
	vec { alice; bob },
	2
);
let MultisigWallet = install(wasm, args, null);

// TestDeploy
call MultisigWallet.getApprovers();
assert _ == vec { alice; bob; };

// TestCreateOpt(Success)
identity alice;
call MultisigWallet.createOpt(
	variant { CreateCanister },
	null,
	null
);
let res = _.ok;
assert res.sent == false;
assert res.optType == variant { CreateCanister };

// TesetCreateOpt(UnAuth)
identity kitty;
call MultisigWallet.createOpt(
	variant { CreateCanister },
	null,
	null
);
assert _.err == "only approver allowed";

// TestApprove
identity alice;
call MultisigWallet.approve(res.id);
identity bob;
call MultisigWallet.approve(res.id);
call MultisigWallet.getOpts();
let opts = _;
assert opts[0].sent == true;
assert opts[0].approvals == (2 : nat);
