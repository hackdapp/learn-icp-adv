import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import M "mo:base/HashMap";
import Time "mo:base/Time";
import Bool "mo:base/Bool";
import Text "mo:base/Text";
import Trie "mo:base/Trie";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Result "mo:base/Result";

module {
	public type Result<T, E> = Result.Result<T, E>;
	public type Canister = Principal;
	public type ID = Nat;

  public type Proposal = {
    id: ID;
    name: Text;
		quorum: Nat;
		canisterId: ?Canister;
		proposalType: ProposalType;
    end: Time.Time;
		votesYes: Nat;
		votesNo: Nat;
		state: ProposalState;
		optId: ?ID;
		member: ?Principal;
  };

	public type Vote = {
		#yes;
		#no;
	};

	public type ProposalState = {
      // A failure occurred while executing the proposal
      #failed : Text;
      // The proposal is open for voting
      #open;
      // The proposal is currently being executed
      #executing;
      // Enough "no" votes have been cast to reject the proposal, and it will not be executed
      #rejected;
      // The proposal has been successfully executed
      #succeeded;
      // Enough "yes" votes have been cast to accept the proposal, and it will soon be executed
      #accepted;
  };

  public type ProposalType = {
    #Limit;
    #UnLimit;
		#AddMember;
		#RemoveMember;
  };

	public type OptType = {
		#InstallCode;
		#UninstallCode;
		#CreateCanister;
		#StartCanister;
		#StopCanister;
		#DeleteCanister;
		#ReplaceApprover;
	};

	public type Opt = {
		id: Nat;
		wasmCode:  ?Blob; // valid only for install code type
		optType: OptType;
		canisterId:  ?Canister; // can be null only for create canister case
		approvals: Nat;
		sent: Bool;
		wasmCodeHash: [Nat8];
		newUser: ?Principal;
		oldUser: ?Principal;
	};

  public func buildKey(t: ID) : Trie.Key<ID> = { key = t; hash = Int.hash t };
	public func buildPrincipalKey(t: Principal): Trie.Key<Principal> = { key = t; hash = Principal.hash t };

	public func buildAddApprove(opt: Opt) : Opt {
		{
			id = opt.id;
			wasmCode = opt.wasmCode;
			optType = opt.optType;
			canisterId =  opt.canisterId;
			approvals = opt.approvals + 1; // update the number
			sent = opt.sent;
			wasmCodeHash = opt.wasmCodeHash;
			newUser = opt.newUser;
			oldUser = opt.oldUser;
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
			wasmCodeHash = opt.wasmCodeHash;
			newUser = opt.newUser;
			oldUser = opt.oldUser;
		}
	};

	public func buildConfirmApprove(opt: Opt) : Opt {
		{
			id = opt.id;
			wasmCode = opt.wasmCode;
			optType = opt.optType;
			canisterId = opt.canisterId;
			approvals = opt.approvals;
			sent = true;
			wasmCodeHash = opt.wasmCodeHash;
			newUser = opt.newUser;
			oldUser = opt.oldUser;
		}
	}
}
