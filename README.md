# multisig_wallet
作业：在第3课作业的基础上，实现以下的功能：
1）对被限权的 canister 进行常规操作时 (比如 install_code)，并不立即执行，改为发起提案，只有提案通过后才执行 。（3 分）
2）简单的前端界面，允许查看当前的提案，已经部署的 canister 列表（包括 id, 当前状态等），小组成员名单等。 （1 分）
3）在前端整合 Internet Identity 登录，登录后看到自己的 Principal ID 。（1 分）
本次课程作业先实现后端的限权操作，不涉及前端提交，或者时前端投票的具体操作。

要求：
1.至少实现一种限权操作，比如 install_code，如果额外实现了其它限权操作，适当加分。
2.在 install_code 的处理过程中，计算 Wasm 的 sha256 值，并作为提案的一部分（这样小组成员才能确认是否要投赞成还是否决）。

## 效果预览图
![](http://cdn.hackdapp.com/2022-06-04-084038.png)
![](http://cdn.hackdapp.com/2022-06-04-083849.png)


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
dfx deploy --network ic  multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae\")}, 1)"

or

dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); },2)"
```

2) 创建操作
```
dfx canister call multisig_wallet createOpt "(variant {\"CreateCanister\"}, null, null)"
```

3) 操作许可
```
dfx identity use default
dfx canister call multisig_wallet approve "(1)"

dfx identity use registered_owner
dfx canister call multisig_wallet approve "(1)"
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
