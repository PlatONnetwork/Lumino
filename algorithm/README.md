# 1. 安装Rust

https://www.rust-lang.org/tools/install

# 2. 编译

## 2.1 编译setup, verif(曲线bn256)

```shell
$ cargo build --release --features bn_curve
```

setup可执行文件路径：MPC-Setup/algorithm/target/release/setup
verify可执行文件路径：MPC-Setup/algorithm/target/release/verify

## 2.2 编译setup, verif(曲线bls12-318)

*注意：重新编译会覆盖bn256编译结果

```shell
$ cargo build --release --features bn_curve
```

setup可执行文件路径：MPC-Setup/algorithm/target/release/setup
verify可执行文件路径：MPC-Setup/algorithm/target/release/verify

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
$ ./setup --output /Users/songxuyang/outputdir --genesis

You are the first participant!
[00:00:03] ########################################      16/16      done
Setup success
```



## 3.2 后续参与者运行setup

```shell
$ ./setup --output /Users/songxuyang/outputdir --input /Users/songxuyang/inputdir

[00:00:04] ########################################      16/16      done
Setup success
```



## 3.3 verify help

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



## 3.3 运行verify，验证第一个参与者的输出

```shell
$ ./verify --input /Users/songxuyang/inputdir

Derivation verify success!
[00:00:02] ########################################      16/16      done
Consistence verify success!
Verify success!
```



## 3.4 运行verify，验证后续参与者的输出

```shell
$ ./verify --input /Users/songxuyang/inputdir --previous /Users/songxuyang/previous-inputdir

Derivation verify success!
[00:00:02] ########################################      16/16      done
Consistence verify success!
Verify success!
```

