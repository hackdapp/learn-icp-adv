export const idlFactory = ({ IDL }) => {
  const OptType = IDL.Variant({
    'InstallCode' : IDL.Null,
    'CreateCanister' : IDL.Null,
    'ReplaceApprover' : IDL.Null,
    'DeleteCanister' : IDL.Null,
    'StopCanister' : IDL.Null,
    'UninstallCode' : IDL.Null,
    'StartCanister' : IDL.Null,
  });
  const Canister = IDL.Principal;
  const Opt = IDL.Record({
    'id' : IDL.Nat,
    'oldUser' : IDL.Opt(IDL.Principal),
    'wasmCode' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'sent' : IDL.Bool,
    'optType' : OptType,
    'wasmCodeHash' : IDL.Vec(IDL.Nat8),
    'approvals' : IDL.Nat,
    'canisterId' : IDL.Opt(Canister),
    'newUser' : IDL.Opt(IDL.Principal),
  });
  const Result_3 = IDL.Variant({ 'ok' : Opt, 'err' : IDL.Text });
  const Time = IDL.Int;
  const ProposalType = IDL.Variant({
    'Limit' : IDL.Null,
    'RemoveMember' : IDL.Null,
    'AddMember' : IDL.Null,
    'UnLimit' : IDL.Null,
  });
  const ID = IDL.Nat;
  const Result_2 = IDL.Variant({ 'ok' : ID, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const ProposalState = IDL.Variant({
    'open' : IDL.Null,
    'rejected' : IDL.Null,
    'executing' : IDL.Null,
    'accepted' : IDL.Null,
    'failed' : IDL.Text,
    'succeeded' : IDL.Null,
  });
  const Proposal = IDL.Record({
    'id' : ID,
    'end' : Time,
    'member' : IDL.Opt(IDL.Principal),
    'optId' : IDL.Opt(ID),
    'votesYes' : IDL.Nat,
    'name' : IDL.Text,
    'proposalType' : ProposalType,
    'state' : ProposalState,
    'votesNo' : IDL.Nat,
    'quorum' : IDL.Nat,
    'canisterId' : IDL.Opt(Canister),
  });
  const Vote = IDL.Variant({ 'no' : IDL.Null, 'yes' : IDL.Null });
  const Result = IDL.Variant({ 'ok' : Proposal, 'err' : IDL.Text });
  const anon_class_16_1 = IDL.Service({
    'approve' : IDL.Func([IDL.Nat], [Result_3], []),
    'createOpt' : IDL.Func(
        [
          OptType,
          IDL.Opt(Canister),
          IDL.Opt(IDL.Vec(IDL.Nat8)),
          IDL.Opt(IDL.Principal),
        ],
        [Result_3],
        [],
      ),
    'createProposal' : IDL.Func(
        [
          IDL.Text,
          IDL.Opt(Canister),
          Time,
          ProposalType,
          IDL.Nat,
          IDL.Opt(IDL.Principal),
        ],
        [Result_2],
        [],
      ),
    'executeProposal' : IDL.Func([ID], [Result_1], []),
    'getApprovers' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getOpts' : IDL.Func([], [IDL.Vec(Opt)], ['query']),
    'getProposals' : IDL.Func([], [IDL.Vec(Proposal)], ['query']),
    'vote' : IDL.Func([IDL.Nat, Vote], [Result], []),
  });
  return anon_class_16_1;
};
export const init = ({ IDL }) => { return [IDL.Vec(IDL.Principal), IDL.Nat]; };
