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

identity alice;
call MultisigWallet.createOpt(
	variant { CreateCanister },
	null,
	null
);
let optId = _.ok.id;
call MultisigWallet.approve(optId);
identity bob;
call MultisigWallet.approve(optId);
call MultisigWallet.getOpts();
let currentCanisiterId = _[0].canisterId?;

// TestCreateProposal(Success)
identity alice;
call MultisigWallet.createProposal(
	"TestProposal",
	currentCanisiterId,
	100000000000,
	variant { Limit },
	2
);
call MultisigWallet.getProposals();
let res = _[0];
assert res.executed == false;
assert res.proposalType == variant { Limit };

// TestVote
identity alice;
call MultisigWallet.vote(res.id);
identity bob;
call MultisigWallet.vote(res.id);
call MultisigWallet.getProposals();
let proposals = _;
assert proposals[0].executed == false;
assert proposals[0].votes == (2 : nat);

// TestExecute
identity alice;
call MultisigWallet.executeProposal(res.id);
assert _.err == "cannot execute proposal before end date";
call MultisigWallet.getProposals();
assert _[0].executed == false;
assert _[0].votes == (2 : nat);
