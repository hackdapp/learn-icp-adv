import Array "mo:base/Array";
import Error "mo:base/Error";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Blob "mo:base/Blob";
import M "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";

import IC "./ic";
import Types "./types";

actor class(_approvers: [Principal], _quorum : Nat) = self {
	private let CYCLE_LIMIT = 2_000_000_000_000;
	private let ic : IC.Self = actor("aaaaa-aa");

  public type Canister = Types.Canister;
  public type ID = Types.ID;
  public type Opt = Types.Opt;
  public type OptType = Types.OptType;

	private var quorum: Nat = _quorum;
	private var approvers: [Principal] = _approvers;
  private var opts: Buffer.Buffer<Opt> = Buffer.Buffer<Opt>(0);
	private var approvals: M.HashMap<Principal, M.HashMap<Text, Bool>> = M.HashMap<Principal, M.HashMap<Text, Bool>>(10, Principal.equal, Principal.hash);

	public query func getApprovers() : async [Principal] {
    approvers
  };

	public query func getOpts() : async [Opt] {
    opts.toArray()
  };

  public shared(msg) func createOpt(optType: OptType, canisterId: ?Canister, wasmCode: ?Blob) : () {
		// Debug.print(debug_show("principal: ", msg.caller));
		// Debug.print(debug_show("approve check: ", Option.isSome(Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) }))));
		assert(Option.isSome(Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })));

		let opt: Opt = {
			id = opts.size();
			wasmCode;
			optType;
			canisterId;
			approvals = 0;
			sent = false;
		};
		opts.add(opt);
	};

	public shared(msg) func approve(id: Nat): async Opt {
		assert(Option.isNull(?opts.get(id)) or opts.get(id).sent == false);
		Debug.print(debug_show("approve check: ", Array.find(approvers, func(a: Principal) : Bool { Principal.equal(a, msg.caller) })));
		assert(Option.isSome(Array.find(approvers, func(a: Principal) : Bool { a == msg.caller})));

		let userApprove = switch(approvals.get(msg.caller)) {
			case null {
				var map =	M.HashMap<Text, Bool>(10, Text.equal, Text.hash);
				map.put(Nat.toText(id), true);
				approvals.put(msg.caller, map);
				approvals
			};
			case (?userVal) {
				let map: M.HashMap<Text, Bool> = switch(userVal.get(Nat.toText(id))){
					case null {
						userVal
					};
					case (?val) {
						assert(val == false);
						userVal
					}
				};
				map.put(Nat.toText(id), true);
				approvals.put(msg.caller, map);
				approvals
			}
		};

		var opt: Opt = Types.buildAddApprove(opts.get(id));
		opts.put(id, opt);
		if (opt.approvals >= quorum) {
			Debug.print(debug_show(msg.caller, "OptType: ", opt.optType, "ID: ", opt.id));
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

						opt := Types.buildAddCanisterId(opt, ?result.canister_id);
					};

					case (#InstallCode) {
						await ic.install_code({
							arg = [];
							wasm_module = Blob.toArray(Option.unwrap(opt.wasmCode));
							mode = #install;
							canister_id = Option.unwrap(opt.canisterId);
						});
					};

					case (#UninstallCode) {
						await ic.uninstall_code({
							canister_id = Option.unwrap(opt.canisterId);
						});
					};

					case (#StartCanister) {
						await ic.start_canister({
							canister_id = Option.unwrap(opt.canisterId);
						});
					};

					case (#StopCanister) {
						await ic.stop_canister({
							canister_id = Option.unwrap(opt.canisterId);
						});
					};

					case (#DeleteCanister) {
						await ic.delete_canister({
							canister_id = Option.unwrap(opt.canisterId);
						});
					};
				}; // switch
				opt := Types.buildConfirmApprove(opt);
				opts.put(id, opt);
		};
		opts.get(id)
	}
}
