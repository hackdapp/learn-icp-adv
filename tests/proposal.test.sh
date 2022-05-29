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
	vec { alice; bob; kitty; },
	2
);
let MultisigWallet = install(wasm, args, null);

// TestDeploy
call MultisigWallet.getApprovers();
assert _ == vec { alice; bob; kitty; };

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
	10000,
	variant { Limit },
	2
);
call MultisigWallet.getProposals();
let proposalId = _[0].id;
assert _[0].votesYes == (0 : nat);
assert _[0].votesNo == (0: nat);
assert _[0].proposalType == variant { Limit };

// TestVote(Yes)
identity alice;
call MultisigWallet.vote(proposalId, variant { yes });
identity bob;
call MultisigWallet.vote(proposalId, variant { yes });
call MultisigWallet.getProposals();
assert _[0].state ==  variant { accepted };
assert _[0].votesYes == (2 : nat);

// TestExecute
identity alice;
call MultisigWallet.executeProposal(proposalId);
call MultisigWallet.getProposals();
assert _[0].state == variant { succeeded };
assert _[0].votesYes == (2 : nat);

call MultisigWallet.executeProposal(proposalId);
assert _.err == "Cannot execute proposal already executed";

// ==================new TestCase=================
identity alice;
call MultisigWallet.createProposal(
	"TestProposal2",
	currentCanisiterId,
	10000,
	variant { Limit },
	2
);
call MultisigWallet.getProposals();
let proposalId = _[1].id;

identity alice;
call MultisigWallet.vote(proposalId, variant { no });
identity bob;
call MultisigWallet.vote(proposalId, variant { no });

call MultisigWallet.getProposals();
assert _[1].state ==  variant { rejected };
assert _[1].votesNo == (2 : nat);

call MultisigWallet.executeProposal(proposalId);
assert _.err == "Only the accepted state can be executed";

