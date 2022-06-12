import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Canister = Principal;
export type ID = bigint;
export interface Opt {
  'id' : bigint,
  'oldUser' : [] | [Principal],
  'wasmCode' : [] | [Array<number>],
  'sent' : boolean,
  'optType' : OptType,
  'wasmCodeHash' : Array<number>,
  'approvals' : bigint,
  'canisterId' : [] | [Canister],
  'newUser' : [] | [Principal],
}
export type OptType = { 'InstallCode' : null } |
  { 'CreateCanister' : null } |
  { 'ReplaceApprover' : null } |
  { 'DeleteCanister' : null } |
  { 'StopCanister' : null } |
  { 'UninstallCode' : null } |
  { 'StartCanister' : null };
export interface Proposal {
  'id' : ID,
  'end' : Time,
  'member' : [] | [Principal],
  'optId' : [] | [ID],
  'votesYes' : bigint,
  'name' : string,
  'proposalType' : ProposalType,
  'state' : ProposalState,
  'votesNo' : bigint,
  'quorum' : bigint,
  'canisterId' : [] | [Canister],
}
export type ProposalState = { 'open' : null } |
  { 'rejected' : null } |
  { 'executing' : null } |
  { 'accepted' : null } |
  { 'failed' : string } |
  { 'succeeded' : null };
export type ProposalType = { 'Limit' : null } |
  { 'RemoveMember' : null } |
  { 'AddMember' : null } |
  { 'UnLimit' : null };
export type Result = { 'ok' : Proposal } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : ID } |
  { 'err' : string };
export type Result_3 = { 'ok' : Opt } |
  { 'err' : string };
export type Time = bigint;
export type Vote = { 'no' : null } |
  { 'yes' : null };
export interface anon_class_16_1 {
  'approve' : ActorMethod<[bigint], Result_3>,
  'createOpt' : ActorMethod<
    [OptType, [] | [Canister], [] | [Array<number>], [] | [Principal]],
    Result_3,
  >,
  'createProposal' : ActorMethod<
    [string, [] | [Canister], Time, ProposalType, bigint, [] | [Principal]],
    Result_2,
  >,
  'executeProposal' : ActorMethod<[ID], Result_1>,
  'getApprovers' : ActorMethod<[], Array<Principal>>,
  'getOpts' : ActorMethod<[], Array<Opt>>,
  'getProposals' : ActorMethod<[], Array<Proposal>>,
  'vote' : ActorMethod<[bigint, Vote], Result>,
}
export interface _SERVICE extends anon_class_16_1 {}
