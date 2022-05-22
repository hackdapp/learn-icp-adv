# multisig_wallet

实现一个简单的多人 Cycle 钱包，可以用于团队协作，提供类似多签的功能，在 N 个成员里面有 M 个同意的情况下，才允许对所控制的 Canister 进行安装、升级代码等需要权限的操作。
本次课程作业先实现一些基本功能，不涉及权限控制等操作。（5分）

要求：
1. 实现一个多人 Cycle 钱包 canister，通过对 IC Management Canister 的调用实现 create_canister, install_code, start_canister, stop_canister, delete_canister 等操作。
2. 通过这种方式创建的 canister 的 controller 必须是这个多人钱包。
3. 提交项目源代码的仓库（不要求部署到主网）。
4. 可以不考虑权限问题，也就是说任何人都可以使用这个钱包。
5. 在做调试的时候可以使用 https://github.com/chenyan2002/ic-repl 这个工具，方便直接上传文件内容。

使用:

1) 发布合约
```
dfx deploy multisig_wallet --argument "(vec { (principal \""$(dfx identity get-principal)"\"); (principal \"syfdf-ycn55-kwkqy-mtr2i-kgztn-i2im2-gan2x-vq2zb-hocqg-k44bc-hae\")},2)"
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

