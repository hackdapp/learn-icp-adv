import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Trie "mo:base/Trie";

import IC "./ic";
import Types "./types";

actor class(_approvers: [Principal], _quorum : Nat) = self {
	let CYCLE_LIMIT = 1_000_000_000_000;
	let ic : IC.Self = actor("aaaaa-aa");

	stable var quorum: Nat = _quorum; // 多签阈值N
	stable var nextOptId = 0;					// 常规操作自增ID
	stable var approvers: [Principal] = _approvers; // 多签成员列表集合
  stable var opts: Trie.Trie<Types.ID, Types.Opt> = Trie.empty<Types.ID, Types.Opt>(); // 常规操作列表集合
	stable var approvals: Trie.Trie<Principal, Trie.Trie<Types.ID, Bool>> = Trie.empty<Principal, Trie.Trie<Types.ID, Bool>>(); // 多签成员审核状态列表集合

  stable var nextProposalId = 0; // 议案自增ID
  stable var proposals: Trie.Trie<Nat, Types.Proposal> = Trie.empty<Nat, Types.Proposal>();
	stable var limitCanisters: Trie.Trie<Principal, Bool> = Trie.empty<Principal, Bool>();
	// var votes: Trie.Trie<Principal, Trie.Trie<Types.ID, Bool>> = Trie.empty<Principal, Trie.Trie<Types.ID, Bool>>();

	func getOptsById(id: Types.ID) : ?Types.Opt = Trie.get(opts, Types.buildKey(id), Nat.equal);
	func saveOrUpdateOpt(id: Nat, opt: Types.Opt) {
		opts := Trie.put(opts, Types.buildKey(id), Nat.equal, opt).0;
	};

	func getProposalById(id: Nat) : ?Types.Proposal = Trie.get(proposals, Types.buildKey(id), Nat.equal);
	func saveOrUpdateProposal(id: Nat, proposal: Types.Proposal) {
		proposals := Trie.put(proposals, Types.buildKey(id), Nat.equal, proposal).0;
	};

	func isLimitCanister(canisterId: ?Principal) : Bool {
		switch (canisterId) {
			case null false;
			case (?val) {
				switch(Trie.get(limitCanisters, Types.buildPrincipalKey(val), Principal.equal)) {
					case null false;
					case (?isLimit){
						isLimit
					}
				};
			};
		};
	};
	func saveLimitCanister(canisterId: Types.Canister, isLimit: Bool) {
		limitCanisters := Trie.put(limitCanisters, Types.buildPrincipalKey(canisterId), Principal.equal, isLimit).0;
	};

	func getApprovalsById(act: Principal, id: Types.ID): Bool {
		switch(Trie.get(approvals, Types.buildPrincipalKey(act), Principal.equal)) {
			case null false;
			case (?vals) {
				switch(Trie.get(vals, Types.buildKey(id), Nat.equal)) {
					case null false;
					case (?val) {
						val
					}
				};
			};
		};
	};

	func saveOrUpdateApprovals(act: Principal, id: Types.ID, isApprove: Bool) {
		switch(Trie.get(approvals, Types.buildPrincipalKey(act), Principal.equal)) {
			case null {
				let val = Trie.put(Trie.empty<Types.ID, Bool>(), Types.buildKey(id), Nat.equal, false).0;
				approvals := Trie.put(approvals, Types.buildPrincipalKey(act), Principal.equal, val).0;
			};
			case (?vals){
				let val = Trie.put(vals, Types.buildKey(id), Nat.equal, isApprove).0;
				approvals := Trie.put(approvals, Types.buildPrincipalKey(act), Principal.equal, val).0;
			}
		};
	};

	func executeOperation(opt: Types.Opt): async ?Types.Canister {
		switch (opt.optType) {
			case (#CreateCanister) {
				Cycles.add(CYCLE_LIMIT);
				let settings : IC.canister_settings =
					{
						freezing_threshold = null;
						controllers = ?[Principal.fromActor(self)];
						memory_allocation = null;
						compute_allocation = null;
					};

				let result = await ic.create_canister({settings = ?settings});
				?result.canister_id
			};

			case (#InstallCode) {
				await ic.install_code({
					arg = [];
					wasm_module = Blob.toArray(Option.unwrap(opt.wasmCode));
					mode = #install;
					canister_id = Option.unwrap(opt.canisterId);
				});
				opt.canisterId
			};

			case (#UninstallCode) {
				await ic.uninstall_code({
					canister_id = Option.unwrap(opt.canisterId);
				});
				opt.canisterId
			};

			case (#StartCanister) {
				await ic.start_canister({
					canister_id = Option.unwrap(opt.canisterId);
				});
				opt.canisterId
			};

			case (#StopCanister) {
				await ic.stop_canister({
					canister_id = Option.unwrap(opt.canisterId);
				});
				opt.canisterId
			};

			case (#DeleteCanister) {
				await ic.delete_canister({
					canister_id = Option.unwrap(opt.canisterId);
				});
				opt.canisterId
			};
		};
	};

	public query func getApprovers() : async [Principal] {
    approvers;
  };

	public query func getOpts() : async [Types.Opt] {
		Iter.toArray(Iter.map(Trie.iter(opts), func(kv: (Nat, Types.Opt)) : Types.Opt = kv.1));
  };

  public shared(msg) func createOpt(optType: Types.OptType, canisterId: ?Types.Canister, wasmCode: ?Blob) : async Types.Result<(Types.Opt), Text> {
		switch (Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })) {
			case null { #err "only approver allowed" };
			case (?_) {
				nextOptId += 1;

				var wasmCodeHash : [Nat8] = [];
				switch(wasmCode){
					case null {};
					case (?val) {
						wasmCodeHash := SHA256.sha256(Blob.toArray(Option.unwrap(wasmCode)));
					};
				};
				let opt: Types.Opt = {
					id = nextOptId;
					wasmCode;
					optType;
					canisterId;
					approvals = 0;
					sent = false;
					wasmCodeHash = wasmCodeHash;
				};
				saveOrUpdateOpt(nextOptId, opt);

				if (isLimitCanister(canisterId)) {
					nextProposalId += 1;
					let proposal : Types.Proposal = {
						id = nextProposalId;
						name = "NewProposal";
						quorum = _quorum;
						canisterId = canisterId;
						proposalType = #Limit;
						end = Time.now() + 10000;
						votesYes = 0;
						votesNo = 0;
						state = #open;
						optId = ?nextOptId;
					};
					saveOrUpdateProposal(nextProposalId, proposal);
				};

				#ok(opt)
			}
		};
	};

		public shared(msg) func approve(id: Nat): async Types.Result<Types.Opt, Text> {
			switch (Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })) {
				case null { return #err "only approver allowed" };
				case (_) {}
			};

			switch(getOptsById(id)){
				case null { return #err "Opt does not exist" };
				case (?opt) {
					if( opt.sent == true ) return #err "Opt already running";
					if( isLimitCanister(opt.canisterId) ) return #err "Has been limited";

					var updateOpt: Types.Opt = Types.buildAddApprove(opt);
					saveOrUpdateApprovals(msg.caller, id, true);
					if (updateOpt.approvals >= quorum) {
						var cid = await executeOperation(updateOpt);
						switch (cid){
							case null {};
							case (?_) {
								updateOpt := Types.buildAddCanisterId(updateOpt, cid);
							};
						};
						updateOpt := Types.buildConfirmApprove(updateOpt);
					};
					saveOrUpdateOpt(id, updateOpt);
					#ok(updateOpt)
				};
			};
	};


	public query func getProposals() : async [Types.Proposal] {
		Iter.toArray(Iter.map(Trie.iter(proposals), func (kv : (Nat, Types.Proposal)) : Types.Proposal = kv.1))
	};

  public shared(msg) func createProposal(name: Text, canisterId: Types.Canister, voteTime: Time.Time, proposalType: Types.ProposalType, quorum: Nat): async Types.Result<Types.ID, Text> {
		switch (Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })) {
			case null { return #err "only approver allowed" };
			case (_) {};
		};

		nextProposalId += 1;
		let proposal : Types.Proposal = {
			id = nextProposalId;
			name = name;
			quorum = quorum;
			canisterId = ?canisterId;
			proposalType = proposalType;
			end = Time.now() + voteTime;
			votesYes = 0;
			votesNo = 0;
			state = #open;
			optId = ?0;
		};

		saveOrUpdateProposal(nextProposalId, proposal);
		#ok(nextProposalId)
  };

  public shared(msg) func vote(proposalId: Nat, vote: Types.Vote) : async Types.Result<(Types.Proposal), Text>{
		switch (Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })) {
			case null { return #err "only approver allowed" };
			case (_) {}
		};

		switch(getProposalById(proposalId)){
        case null { return #err("No proposal with ID  exists") };
				case (?proposal) {
					var votesYes = proposal.votesYes;
					var votesNo = proposal.votesNo;
					switch(vote) {
						case (#yes) { votesYes += 1; };
						case (#no) { votesNo += 1; };
					};

					var state = proposal.state;
					if (votesYes >= proposal.quorum) {
							state := #accepted;
					};
					if (votesNo >= proposal.quorum) {
							state := #rejected;
					};

					let updatedProposal: Types.Proposal = {
							id = proposal.id;
							name = proposal.name;
							quorum = proposal.quorum;
							canisterId = proposal.canisterId;
							proposalType = proposal.proposalType;
							end = proposal.end;
							votesYes;
							votesNo;
							state;
							optId = proposal.optId;
					};
					saveOrUpdateProposal(proposal.id, updatedProposal);
					#ok(updatedProposal);
				};
		};
  };

  public shared(msg) func executeProposal(proposeId: Types.ID): async Types.Result<(), Text> {
		switch (Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })) {
			case null { return #err "only approver allowed" };
			case (_) {};
		};

		switch(getProposalById(proposeId)){
			case null { return #err "No proposal with ID  exists" };
			case (?proposal) {
				if (proposal.end > Time.now()) { return #err("Cannot execute proposal before end date"); };
				if (proposal.state == #succeeded) { return #err("Cannot execute proposal already executed"); };
				if (proposal.state != #accepted) { return #err("Only the accepted state can be executed"); };

				switch (proposal.canisterId) {
					case null {};
					case (?cid) {
						switch(proposal.proposalType) {
							case (#Limit) {
								saveLimitCanister(cid, true);
							};
							case (#UnLimit) {
								saveLimitCanister(cid, false);
							};
						};
					};
				};

				switch (proposal.optId) {
					case null {};
					case (?optId) {
						switch(getOptsById(optId)) {
							case null {};
							case (?opt) {
								var cid = await executeOperation(opt);
								var updateOpt = Types.buildAddCanisterId(opt, cid);
								saveOrUpdateOpt(opt.id, updateOpt);
							};
						};
					};
				};

				let updatedProposal: Types.Proposal = {
					id = proposal.id;
					name = proposal.name;
					quorum = proposal.quorum;
					canisterId = proposal.canisterId;
					proposalType = proposal.proposalType;
					end = proposal.end;
					votesYes = proposal.votesYes;
					votesNo = proposal.votesNo;
					state = #succeeded;
					optId = proposal.optId;
				};
				saveOrUpdateProposal(proposal.id, updatedProposal);
				#ok();
			};
		};
  };


}
