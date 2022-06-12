import React, { useEffect, useState } from 'react';
import { FaBattleNet } from 'react-icons/fa';
import { VscCopy, VscCloudDownload, VscDebugStart } from "react-icons/vsc";
import { canisterId as CANISTER_ID, multisig_wallet, createActor, idlFactory} from "../../declarations/multisig_wallet";
import PlugConnect from '@psychedelic/plug-connect';
import { AuthClient } from "@dfinity/auth-client";
import { a } from '../dist/assets/vendor.93424779';
import { Principal } from "@dfinity/principal";


const whitelist = [process.env.MULTISIG_WALLET_CANISTER_ID];
const host = "http://localhost:8080/";

const App = () => {
  const [loginName, setLoginName] = React.useState('');
  const [proposals, setProposals] = React.useState([]);
	const [canisters, setCanisters] = React.useState([]);
	const [approvers, setApprovers] = React.useState([]);
	const [optList, setOptList] = React.useState([]);
	const [isLoginIn, setLoginStatus] = React.useState(false);


  let authClient;
	let contract = multisig_wallet;

	const newOpt = {
		optType: 'InstallCode',
		canisterId: '',
		wasmCode: ''
	};

	const newProposal = {
		name: '',
		type: '',
		canisterId: '',
		member: ''
	};

	const handleInputChange = (event) => {
    const target = event.target;
		const name = target.name;
		let value = null;
		if (target.type == 'checkbox') {
			value = target.checked;
		} else if (target.type == 'file') {
			console.log(event.target)
			if (target.readyState === FileReader.DONE) {
				const arrayBuffer = target.result,
				value = new Uint8Array(arrayBuffer);
			}
		} else {
			value = target.value;
		}

		newOpt[name] = value;
  };

	const handleProposalInputChange = (event) => {
    const target = event.target;
		const name = target.name;
		let value = target.value;

		newProposal[name] = value;
		console.log(newProposal)
  };

	// 查询提案列表
	const fetchProposal = async () => {
		let proposals = await contract.getProposals();
		proposals = proposals.map(item => {
			return {
				id: item.id + "",
				name: item.name +"",
				votesYes: item.votesYes +"",
				votesNo: item.votesNo +"",
				canisterId: item.canisterId[0] ? item.canisterId[0].toText() : "", // item.canisterId ? item.canisterId[0].toText() : "",
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

	function dicCanisterToText(item){
		if(item.hasOwnProperty("InstallCode")){
			return "InstallCode";
		} else if(item.hasOwnProperty("UninstallCode")){
			return "UninstallCode";
		} else if(item.hasOwnProperty("CreateCanister")){
			return "CreateCanister";
		} else if(item.hasOwnProperty("StartCanister")){
			return "StartCanister";
		} else if(item.hasOwnProperty("StopCanister")){
			return "StopCanister";
		} else if(item.hasOwnProperty("DeleteCanister")){
			return "DeleteCanister";
		} else if(item.hasOwnProperty("ReplaceApprover")){
			return "ReplaceApprover";
		}
	}

	// 查询已经部署canister列表
	const fetchCanister = async () => {
		const opts = await contract.getOpts();
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
		const approvers = await contract.getApprovers();
		setApprovers(approvers)
	}

	const fetchOptList = async () => {
		let optList = await contract.getOpts();
		optList = optList.map(item => {
			return {
				id: item.id + "",
				optType: dicCanisterToText(item.optType) +"",
				canisterId: item.canisterId +"",
				approvals: item.approvals +"",
				sent: item.sent
			}
		});
		setOptList(optList)
	}

	const createOpt = async () => {
		let result = await contract.createOpt({[newOpt.optType]:null}, [], [], []);
		if(result && result.Ok) {
			newOpt = {}
			await fetchOptList();
		}
	};

	const createProposal = async () => {
		let canisterId = newProposal.canisterId && newProposal.canisterId!='' ? Principal.fromText(newProposal.canisterId) : [];
		let member = newProposal.member && newProposal.member!='' ? Principal.fromText(newProposal.member) : [];
		let result = await contract.createProposal(newProposal.name, canisterId, 1000, {[newProposal.type]:null}, 1, member);
		if(result && result.Ok) {
			newProposal = {};
			await fetchProposal();
		}
	};

	const vote = async (pid, flag) => {
		let result = null;
		if (flag) {
			result = await contract.vote(parseInt(pid), {yes: null} );
		} else {
			result = await contract.vote(parseInt(pid), {no: null});
		}
		await fetchProposal();
	};


	const handleAuth = async () => {
		let identity = authClient.getIdentity();
		setLoginStatus(true);
		setLoginName(identity.getPrincipal().toString());
		contract = createActor(CANISTER_ID, {
			agentOptions: {
				identity: authClient.getIdentity(),
			},
		});
  };

	const checkAuth = async () => {
		authClient = await AuthClient.create();
		// console.log(authClient.getIdentity().getPrincipal())
    if (await authClient.isAuthenticated()) {
      handleAuth();
    }
	};

	const doLogin = async () => {
		authClient = await AuthClient.create();
		await authClient.login({
			// 7 days in nanoseconds
			maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
			onSuccess: async () => {
				await handleAuth()
			},
		});
	}

	useEffect(() => {
			checkAuth();
			fetchApprovers();
			fetchCanister();
			fetchProposal();
			fetchOptList();
  }, []);

	const LoginBtn = () => {
		if (isLoginIn) {
			return loginName;
		} else {
			return (
				<button onClick={doLogin} type="button" class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 mr-2 mb-2">
					<svg class="w-4 h-4 mr-2 -ml-1" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook-f" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M279.1 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.4 0 225.4 0c-73.22 0-121.1 44.38-121.1 124.7v70.62H22.89V288h81.39v224h100.2V288z"></path></svg>
					Login
				</button>
			);
		}
	};

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
					<th class="p-2 w-1/8">序列</th>
					<th class="p-2 w-1/8">议案名称</th>
					<th class="p-2 w-1/8">容器编码</th>
					<th class="p-2 w-1/8">赞成票</th>
					<th class="p-2 w-1/8">反对票</th>
					<th class="p-2 w-1/8">状态</th>
					<th class="p-2 w-2/8">操作</th>
				</tr>
			</thead>
			<tbody>
			{
				proposals.map((item, i) =>
					<tr key={i}  class="bg-white mb-4">
						<td class="text-center">{item.id}</td>
						<td class="text-center">{item.name}</td>
						<td class="text-center">{item.canisterId}</td>
						<td class="text-center">{item.votesYes}</td>
						<td class="text-center">{item.votesNo}</td>
						<td class="text-center font-bold text-green-600">{item.state}</td>
						<td class="text-center  gap-3 ">
							<button onClick={vote.bind(this, item.id, true)} class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button" data-modal-toggle="defaultModal">
								赞成
							</button>
							<button onClick={vote.bind(this, item.id, false)} class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button" data-modal-toggle="defaultModal">
							  反对
							</button>
					</td>
					</tr>
				)
			}
			</tbody>
		</table>
	)

	const OptList = () => (
		<table class="w-full">
			<thead>
				<tr class="w-1/2 bg-indigo-300">
					<th class="p-2 w-1/6">序列</th>
					<th class="p-2 w-1/6">操作类型</th>
					<th class="p-2 w-1/6">容器编码</th>
					<th class="p-2 w-1/6">审核数量</th>
					<th class="p-2 w-1/6">是否运行</th>
					<th class="p-2 w-1/6">合约指纹</th>
				</tr>
			</thead>
			<tbody>
			{
				optList.map((item, i) =>
					<tr key={i}  class="bg-white">
						<td class="text-center">{item.id}</td>
						<td class="text-center">{item.optType}</td>
						<td class="text-center">{item.canisterId}</td>
						<td class="text-center">{item.approvals}</td>
						<td class="text-center">{item.sent}</td>
						<td class="text-center font-bold text-green-600">{item.wasmCodeHash}</td>
					</tr>
				)
			}
			</tbody>
		</table>
	)
  return (
		<div class="bg-gray-100 flex flex-col h-screen justify-between">
		<nav class="flex-1 flex h-16 shadow-lg justify-between items-center space-x-8 bg-white text-gray-800 px-5 py-3 text-sm fixed top-0 left-0 right-0 z-10">
			<div class="flex items-center space-x-4">
				<FaBattleNet size="28" />
				<h1 class="text-title text-2xl font-medium">DAO</h1>
			</div>
			<div>
				<LoginBtn></LoginBtn>
			</div>
		</nav>
		<div class="bg-white flex flex-col items-center mt-16 space-y-5 p-12 flex-grow h-full">
				<div class="h-full rounded-md p-2 w-full bg-neutral-100" >
					<h3 class="text-md font-bold text-gray-600 py-1 mb-2">操作列表</h3>
					<div class="mb-4 p-4 rounded-lg shadow-lg bg-white grid grid-cols-4 gap-4 w-full align-middle">
						<div class="form-group">
							<select id="optType"  name="optType" onChange={handleInputChange} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
								<option >请选择操作类型</option>
								<option value="InstallCode">安装合约代码</option>
								<option value="UninstallCode">卸载合约代码</option>
								<option value="CreateCanister">创建容器</option>
								<option value="StartCanister">启动容器</option>
								<option value="StopCanister">停止容器</option>
								<option value="DeleteCanister">删除容器</option>
							</select>
						</div>
						<div class="form-group">
							<input type="text" name="canisterId"  onChange={handleInputChange}   class="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" aria-describedby="emailHelp124" placeholder="容器编码"/>
						</div>
						<div class="form-group">
							<input  onChange={handleInputChange} name="wasmCode" class="form-control block w-full px-3 py-1 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" id="file_input" type="file"  placeholder="合约代码(可选)"></input>
						</div>
						<div class="form-group">
							<button type="button" onClick={createOpt} class="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 ">创建</button>
						</div>
					</div>
					<OptList></OptList>
				</div>
				<div class="h-auto rounded-md p-2 w-full bg-neutral-100 mt-2" >
					<h3 class="text-md font-bold text-gray-600 py-1 mb-2">议案列表</h3>
					<div class="mb-4 p-4 rounded-lg shadow-lg bg-white grid grid-cols-4 gap-4 w-full align-middle">
						<div class="form-group">
							<select id="type" value={newProposal.type} name="type" onChange={handleProposalInputChange} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
								<option >请选择提案类型</option>
								<option value="Limit">限制Canister</option>
								<option value="UnLimit">解除限制</option>
								<option value="AddMember">添加小组成员</option>
								<option value="RemoveMember">删除小组成员</option>
							</select>
						</div>
						<div class="form-group">
							<input type="text" name="name"  onChange={handleProposalInputChange}   class="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" aria-describedby="emailHelp124" placeholder="议案名称"/>
						</div>
						<div class="form-group">
							<input type="text" name="canisterId"  onChange={handleProposalInputChange}   class="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" aria-describedby="emailHelp124" placeholder="容器编码"/>
						</div>
						<div class="form-group">
							<input onChange={handleProposalInputChange} name="member" class="form-control block w-full px-3 py-1 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"  type="text"  placeholder="成员身份(可选)"></input>
						</div>
						<div class="form-group">
							<button type="button" onClick={createProposal} class="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 ">创建</button>
						</div>
					</div>
					<ProposalList></ProposalList>
				</div>
				<div class="flex flex-col w-full">
					<div class="border-b-2 border-gray-300 mb-4 mt-6">
					</div>
					<div class="flex flex-row justify-between w-full space-x-4">
						<div class="flex-1 rounded-md p-2 bg-neutral-100 w-1/2" >
							<h3 class="text-md font-bold text-gray-600 py-1">小组成员</h3>
							<div class="mt-3 flex justify-end">
								<ApproverList></ApproverList>
							</div>
						</div>
						<div class="flex-1 rounded-md p-2  bg-neutral-100 w-1/2" >
							<h3 class="text-md font-bold text-gray-600 py-1">合约列表</h3>
							<div class="mt-3">
								<CanisterList></CanisterList>
							</div>
						</div>
					</div>
				</div>
		</div>
		<div class="bg-gray-100 pt-2">
			<div class="flex pb-5 px-3 m-auto pt-5 border-t text-gray-800 text-sm flex-col md:flex-row max-w-6xl">
				<div class="mt-2">© Copyright 2020. All Rights Reserved.</div>
				<div class="md:flex-auto md:flex-row-reverse mt-2 flex-row flex">
				</div>
			</div>
		</div>
	</div>
  );
};

export default App;
