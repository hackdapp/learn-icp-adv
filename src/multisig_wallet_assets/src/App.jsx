import React, { useEffect, useState } from 'react';
import { FaBattleNet } from 'react-icons/fa';
import { VscCopy, VscCloudDownload, VscDebugStart } from "react-icons/vsc";
import { multisig_wallet } from "../../declarations/multisig_wallet";
import PlugConnect from '@psychedelic/plug-connect';

const whitelist = [process.env.MULTISIG_WALLET_CANISTER_ID];
const host = "http://localhost:8080/";

const App = () => {
  const [loginName, setLoginName] = React.useState('');
  const [proposals, setProposals] = React.useState([]);
	const [canisters, setCanisters] = React.useState([]);
	const [approvers, setApprovers] = React.useState([]);

	const verifyConnectionAndAgent = async () => {
		const connected = await window.ic.plug.isConnected();
		// if (!connected) window.ic.plug.requestConnect({ whitelist, host });
		if (connected) {
			if (!window.ic.plug.agent) {
				await window.ic.plug.createAgent({ whitelist, host });
			}
			const principal = await window.ic.plug.agent.getPrincipal();
			setLoginName(principal.toText())
		}
	};

	// 查询提案列表
	const fetchProposal = async () => {
		let proposals = await multisig_wallet.getProposals();
		proposals = proposals.map(item => {
			return {
				id: item.id + "",
				name: item.name +"",
				votesYes: item.votesYes +"",
				votesNo: item.votesNo +"",
				canisterId: item.canisterId[0].toText(), // item.canisterId ? item.canisterId[0].toText() : "",
				state: dicToText(item.state)
			}
		});
		setProposals(proposals);
	};

	function dicToText(item){
		if(item.hasOwnProperty("failed")){
			return "failed";
		} else if(item.hasOwnProperty("open")){
			return "open";
		} else if(item.hasOwnProperty("executing")){
			return "executing";
		} else if(item.hasOwnProperty("rejected")){
			return "rejected";
		} else if(item.hasOwnProperty("succeeded")){
			return "succeeded";
		} else if(item.hasOwnProperty("accepted")){
			return "accepted";
		}
	}

	// 查询已经部署canister列表
	const fetchCanister = async () => {
		const opts = await multisig_wallet.getOpts();
		let canisters = opts.filter(item => item.optType.hasOwnProperty("CreateCanister") && item.sent == true ).map(item => {
			return {
				id: item.id + "",
				canisterId: item.canisterId ? item.canisterId[0].toText() : "",
				sent: item.sent ? "已执行": "未执行"
			}
		});
		setCanisters(canisters);
	}

	// 查询小组成员名单
	const fetchApprovers = async () => {
		const approvers = await multisig_wallet.getApprovers();
		setApprovers(approvers)
	}

	useEffect(() => {
			verifyConnectionAndAgent();
			fetchApprovers();
			fetchCanister();
			fetchProposal();
  }, []);

	const renderNotConnectedContainer = () => (
			<PlugConnect
			whitelist={ whitelist }
			onConnectCallback={
				async () => {
					const principal = await window.ic.plug.agent.getPrincipal();
					setLoginName(principal.toText())
				}
			}
		/>
	);

	const ApproverList = () => (
		<table class="w-full">
			<thead>
				<tr class="w-1/2 bg-indigo-300">
					<th class="p-2 w-1/4 ">序列</th>
					<th class="p-2 w-3/4 text-center">Principal</th>
				</tr>
			</thead>
			<tbody>
				{
					approvers.map((item, i) =>
						<tr key={i} class="bg-white">
							<td class="p-2 text-center w-1/4">{i}</td>
							<td class="p-2 text-left w-3/4">{item.toText()}</td>
						</tr>
					)
				}
			</tbody>
		</table>
	);

	const CanisterList = () => (
		<table class="w-full">
			<thead>
				<tr class="w-1/2 bg-indigo-300">
					<th class="p-2 w-1/3">序列</th>
					<th class="p-2 w-1/3 text-center">CanisterId</th>
					<th class="p-2 w-1/3 text-center">执行状态</th>
				</tr>
			</thead>
			<tbody>
			{
				canisters.map((item, i) =>
					<tr key={i} class="bg-white">
						<td class="p-2 text-center">{item.id}</td>
						<td class="p-2 text-center">{item.canisterId}</td>
						<td class="p-2 pr-4 text-center font-bold text-green-600">{item.sent}</td>
					</tr>
				)
			}
			</tbody>
		</table>
	)

	const ProposalList = () => (
		<table class="w-full">
			<thead>
				<tr class="w-1/2 bg-indigo-300">
					<th class="p-2 w-1/6">序列</th>
					<th class="p-2 w-1/6">名称</th>
					<th class="p-2 w-1/6">CanisterId</th>
					<th class="p-2 w-1/6">赞成</th>
					<th class="p-2 w-1/6">反对</th>
					<th class="p-2 w-1/6">状态</th>
				</tr>
			</thead>
			<tbody>
			{
				proposals.map((item, i) =>
					<tr key={i}  class="bg-white">
						<td class="text-center">{item.id}</td>
						<td class="text-center">{item.name}</td>
						<td class="text-center">{item.canisterId}</td>
						<td class="text-center">{item.votesYes}</td>
						<td class="text-center">{item.votesNo}</td>
						<td class="text-center font-bold text-green-600">{item.state}</td>
					</tr>
				)
			}
			</tbody>
		</table>
	)
  return (
		<div className="bg-gray-100 flex flex-col h-screen justify-between">
		<nav className="flex-1 flex h-16 shadow-lg justify-between items-center space-x-8 bg-white text-gray-800 px-5 py-3 text-sm fixed top-0 left-0 right-0 z-10">
			<div className="flex items-center space-x-4">
				<FaBattleNet size="28" />
				<h1 className="text-title text-2xl font-medium">DAO</h1>
			</div>
		</nav>
		<div className="bg-white flex flex-col items-center mt-16 space-y-5 p-12 flex-grow h-full max-h-full">
				<div>
					<h1 className="h-4 text-xl text-gray-800 tracking-wider font-bold text-right">
					 { loginName ? loginName : renderNotConnectedContainer() }
					</h1>
				</div>
				<div className="h-auto rounded-md p-2 w-full bg-neutral-100" >
					<h3 className="text-md font-bold text-gray-600 py-1 mb-2">ProposalList</h3>
					<ProposalList></ProposalList>
				</div>
				<div className="flex flex-col w-full">
					<div className="border-b-2 border-gray-300 mb-4 mt-6">
					</div>
					<div className="flex flex-row justify-between w-full space-x-4">
						<div className="flex-1 rounded-md p-2 bg-neutral-100 w-1/2" >
							<h3 className="text-md font-bold text-gray-600 py-1">小组成员</h3>
							<div className="mt-3 flex justify-end">
								<ApproverList></ApproverList>
							</div>
						</div>
						<div className="flex-1 rounded-md p-2  bg-neutral-100 w-1/2" >
							<h3 className="text-md font-bold text-gray-600 py-1">CanisterList</h3>
							<div className="mt-3">
								<CanisterList></CanisterList>
							</div>
						</div>
					</div>
				</div>
		</div>
		<div className="bg-gray-100 pt-2">
			<div className="flex pb-5 px-3 m-auto pt-5 border-t text-gray-800 text-sm flex-col md:flex-row max-w-6xl">
				<div className="mt-2">© Copyright 2020. All Rights Reserved.</div>
				<div className="md:flex-auto md:flex-row-reverse mt-2 flex-row flex">
				</div>
			</div>
		</div>
	</div>
  );
};

export default App;
