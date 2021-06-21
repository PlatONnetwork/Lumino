# 1. 安装Rust

https://www.rust-lang.org/tools/install

# 2. 编译

## 2.1 编译setup, verify(曲线bn256)
注：bn256和bn254实质上是同一条曲线。由于历史原因，不同的社区如以太坊称为bn254,而在一些其他场合如ietf(https://tools.ietf.org/id/draft-yonezawa-pairing-friendly-curves-00.html)称为bn256。算法代码沿用bn256的习惯。

```shell
$ cargo build --release --features bn_curve
```

setup可执行文件路径：MPC-Setup/algorithm/target/release/setup

完整校验可执行文件路径：MPC-Setup/algorithm/target/release/verify

接龙校验（derivation verify）可执行文件路径：MPC-Setup/algorithm/target/release/derivation_verify

## 2.2 编译setup, verify(曲线bls12-318)

*注意：编译会覆盖之前bn256编译结果

```shell
$ cargo build --release --features bls_curve
```

setup可执行文件路径：MPC-Setup/algorithm/target/release/setup

完整校验可执行文件路径：MPC-Setup/algorithm/target/release/verify

接龙校验（derivation verify）可执行文件路径：MPC-Setup/algorithm/target/release/derivation_verify


# 3 运行

### 3.0 setup help

```shell
$ ./setup --help

mpc_crs 0.1.0
Platon

USAGE:
    setup [FLAGS] [OPTIONS] --output <output>

FLAGS:
    -g, --genesis    First participant
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -i, --input <input>      Input path
    -n, --num <num>          Num of g1
    -o, --output <output>    Output path
    -r, --random <random>    Random string
```



## 3.1 第一个参与者运行setup

```shell
$ mkdir test1
$ ./setup --output ./test1 --genesis

You are the first participant!
creating 0:328 1:8216 2:8216 3:8216 4:8216 5:8216 6:8216 7:8216 8:8216 9:8216 10:8216 11:8216 12:8216 13:8216 14:8216 15:8216 16:8216
wrote 0 328
progress 1
wrote 1 8216
...
...
progress 100
Setup success
```



## 3.2 后续参与者运行setup

```shell
$ mkdir test2
$ ./setup --output ./test2 --input ./test1

creating 0:328 1:8216 2:8216 3:8216 4:8216 5:8216 6:8216 7:8216 8:8216 9:8216 10:8216 11:8216 12:8216 13:8216 14:8216 15:8216 16:8216
wrote 0 328
progress 1
wrote 1 8216
...
...
wrote 16 8216
progress 100
Setup success
```



## 3.3 完整verify help

完整校验包含两个部分：derivation校验和consistence校验。

player和server都会进行完整校验，完整校验需要下载完整当前player数据和前序player数据。

verifier仅进行derivation校验，derivation校验仅需要file0.data数据。

```shell
$ ./verify --help

mpc_crs 0.1.0
Platon

USAGE:
    verify [OPTIONS] --input <input>

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -i, --input <input>          Input path
    -p, --previous <previous>    Previous participant transcript 0 file path
```



## 3.4 运行完整verify，验证第一个参与者的输出

```shell
$ ./verify --input ./test1

Derivation verify success!
progress 1
progress 5
...
...
progress 100
Consistence verify success!
Fully verify success!
```



## 3.4 运行完整verify，验证后续参与者的输出

```shell
$ ./verify --input ./test2 --previous ./test1

Derivation verify success!
progress 1
progress 5
...
...
progress 100
Consistence verify success!
Fully verify success!
```

# 4 Verifier进行接龙校验（Derivation Verification）

接龙校验仅需要下载当前player的file_0.dat，以及前序player的file_0.dat作为输入（第一个player没有前序player，只需当前file_0.dat）。

## 4.1 运行derivation verify，验证第一个参与者的输出

```shell
$ ./derivation_verify --input ./test1

Derivation verify success!
```

## 4.2 运行derivation verify，验证第后续参与者的输出
```shell
$ ./derivation_verify --input ./test2 --previous ./test1

Derivation verify success!
```
