# multisig_wallet

作业：在第2课作业的基础上，实现以下的功能：
用 Actor Class 参数来初始化 M, N, 以及最开始的小组成员（principal id)。（1分）
允许发起提案，比如对某个被多人钱包管理的 canister 限制权限。（1分）
统计小组成员对提案的投票（同意或否决），并根据投票结果执行决议。（2分）
在主网部署，并调试通过。（1 分）
本次课程作业先实现基本的提案功能，不涉及具体限权的操作。

要求：
1.设计发起提案 (propose) 和对提案进行投票 (vote) 的接口。
2.实现以下两种提案：
-开始对某个指定的 canister 限权。
-解除对某个指定的 canister 限权。
3.在调用 IC Management Canister 的时候，给出足够的 cycle。

## 测试用例脚本
### 1.1 多签用例
```
ic-repl ./tests/multisig.test.sh
```

### 1.2 提案用例
```
ic-repl ./tests/proposal.test.sh
```

----

使用:

1) 发布合约
```
dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae\")}, 2)"

dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); },2)"
```

2) 创建操作
```
dfx canister call multisig_wallet createOpt "(variant {\"CreateCanister\"}, null, null)"
```

3) 操作许可
```
dfx canister call multisig_wallet approve "(0)"
```

修改帐户:
```
dfx identity use registered_owner
dfx canister call multisig_wallet approve "(0)"
```

