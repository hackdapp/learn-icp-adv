# multisig_wallet

作业：在第3课作业的基础上，实现以下的功能：
1）对被限权的 canister 进行常规操作时 (比如 install_code)，并不立即执行，改为发起提案，只有提案通过后才执行 。（3 分）
2）简单的前端界面，允许查看当前的提案，已经部署的 canister 列表（包括 id, 当前状态等），小组成员名单等。 （1 分）
3）在前端整合 Internet Identity 登录，登录后看到自己的 Principal ID 。（1 分）
本次课程作业先实现后端的限权操作，不涉及前端提交，或者时前端投票的具体操作。

要求：
1.至少实现一种限权操作，比如 install_code，如果额外实现了其它限权操作，适当加分。
2.在 install_code 的处理过程中，计算 Wasm 的 sha256 值，并作为提案的一部分（这样小组成员才能确认是否要投赞成还是否决）。

在第4课作业的基础上，实现以下的功能（一个简单但是功能自洽的 DAO 系统）（5分）：
1）前端对 canister 进行操作，包括 create_canister, install_code, start_canister, stop_canister, delete_canister。对被限权的 Canister 的操作时，会发起新提案。
2）前端可以上传 Wasm 代码，用于 install_code。
3）前端发起提案和投票的操作。
4）支持增加和删除小组成员的提案。
5）让多人钱包接管自己（对钱包本身的操作，比如升级，需要走提案流程）


## 效果预览图
![](http://cdn.hackdapp.com/2022-06-04-084038.png)
![](http://cdn.hackdapp.com/2022-06-04-083849.png)

### 前端容器地址
https://auqfh-daaaa-aaaal-qa4za-cai.ic0.app/

### 后端容器地址
https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app/?id=a5to3-viaaa-aaaal-qa4yq-cai

### 源码地址
https://github.com/hackdapp/learn-icp-adv/tree/hw-04



## 测试用例脚本
```
dfx identity new Bob; dfx identity use Bob; export BOB=$(dfx identity get-principal);
dfx identity new Alice; dfx identity use Alice; export ALICE=$(dfx identity get-principal);
```

### 1.1 多签用例
```
ic-repl ./tests/multisig.test.sh
```

### 1.2 提案用例
```
ic-repl ./tests/proposal.test.sh
```

## 手动发布

1) 发布合约
```
dfx deploy --network ic  multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"1ed8694404923f263148bade71c5fb0455d64693a6819a12edafeadbff490b93\")}, 1)"

or

dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae\");(principal \"2vxsx-fae\");}, 1)"
```

2) 创建操作
```
dfx canister --network ic call multisig_wallet createOpt "(variant {\"CreateCanister\"}, null, null)"
```

3) 操作许可
```
dfx identity use default
dfx canister --network ic  call multisig_wallet approve "(1)"

dfx identity use registered_owner
dfx canister  --network ic call multisig_wallet approve "(1)"
```

4) 创建提案
```
dfx canister --network ic call multisig_wallet createProposal "(\"TestProposal-001\", (principal \"fupft-7iaaa-aaaal-qa4eq-cai\"), 1000, variant {\"Limit\"}, 2)"

dfx canister call multisig_wallet createOpt "(variant {\"InstallCode\"}, (principal \"2tyii-jyaaa-aaaaa-aab5a-cai\"), null)"
```

5) 提案投票
```
dfx identity use default
dfx canister --network ic call multisig_wallet vote "(1, variant{\"yes\"})"

dfx identity use registered_owner
dfx canister --network ic call multisig_wallet vote "(1, variant{\"yes\"})"
```

6) 执行提案
```
dfx canister --network ic call multisig_wallet executeProposal "(1)"
```

7) 提案列表
```
dfx canister --network ic call multisig_wallet getProposals "()"
```

----------------------------------------------------------------

### 接管当前用户

```
dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"yaabf-t65wc-omdrk-2aatu-44kfr-rszl2-o26gb-s3ahk-gcxg7-vq4z3-uqe\");(principal \"2vxsx-fae\");}, 1)"

// 替换当前方法调用者
dfx canister call multisig_wallet createOpt "(variant {\"ReplaceApprover\"}, null, null, opt (principal \"syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae\"))"

dfx identity use registered_owner //syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae
dfx canister call multisig_wallet approve "(1)"
```

### 增加或减少小组成员
```
dfx canister call multisig_wallet getApprovers ()
dfx canister call multisig_wallet createProposal "(\"TestProposal-001\", null, 1000,  variant {\"AddMember\"}, 1, opt (principal \"yh6zv-uk3ud-rny6y-indyi-7c6fs-2elqz-yq4e3-qgeik-eyoq3-sgfw4-jqe\"))"
dfx canister call multisig_wallet vote "(2, variant{\"yes\"})"
dfx canister call multisig_wallet executeProposal "(2)"
dfx canister call multisig_wallet getApprovers ()

dfx canister call multisig_wallet createProposal "(\"TestProposal-002\", null, 1000,  variant {\"RemoveMember\"}, 1, opt (principal \"yh6zv-uk3ud-rny6y-indyi-7c6fs-2elqz-yq4e3-qgeik-eyoq3-sgfw4-jqe\"))"
dfx canister call multisig_wallet vote "(3, variant{\"yes\"})"
dfx canister call multisig_wallet executeProposal "(3)"
dfx canister call multisig_wallet getApprovers ()
```
