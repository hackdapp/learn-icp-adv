import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import M "mo:base/HashMap";

module {
	public type Canister = Principal;
	public type ID = Nat;

	public type OptType = {
		#InstallCode;
		#UninstallCode;
		#CreateCanister;
		#StartCanister;
		#StopCanister;
		#DeleteCanister;
	};

	public type Opt = {
		id: Nat;
		wasmCode:  ?Blob; // valid only for install code type
		optType: OptType;
		canisterId:  ?Canister; // can be null only for create canister case
		approvals: Nat;
		sent: Bool;
	};

	public func buildAddApprove(opt: Opt) : Opt {
		{
			id = opt.id;
			wasmCode = opt.wasmCode;
			optType = opt.optType;
			canisterId =  opt.canisterId;
			approvals = opt.approvals + 1; // update the number
			sent = opt.sent;
		}
	};

		public func buildAddCanisterId(opt: Opt, canisterId: ?Canister) : Opt {
		{
			id = opt.id;
			wasmCode = opt.wasmCode;
			optType = opt.optType;
			canisterId =  canisterId;
			approvals = opt.approvals; // update the number
			sent = opt.sent;
		}
	};

	public func buildConfirmApprove(opt: Opt) : Opt {
		{
			id = opt.id;
			wasmCode = opt.wasmCode;
			optType = opt.optType;
			canisterId = opt.canisterId;
			approvals = opt.approvals;
			sent = true; // update confirm status
		}
	}

	// public func buildUserApproveNum(approvals: M.HashMap<Principal, M.HashMap<ID, Bool>>): M.HashMap<Principal, M.HashMap<ID, Bool>>{

	// }
}
