# 1. Install Rust

https://www.rust-lang.org/tools/install

# 2. Compile

## 2.1 Compile setup, verify(curve bn256)

```shell
$ cargo build --release --features bn_curve
```

setup bin path：MPC-Setup/algorithm/target/release/setup

full verify bin path：MPC-Setup/algorithm/target/release/verify

derivation verify bin path：MPC-Setup/algorithm/target/release/derivation_verify

## 2.2 Compile setup, verify(curve bls12-318)

```shell
$ cargo build --release --features bls_curve
```

setup bin path：MPC-Setup/algorithm/target/release/setup

full verify bin path：MPC-Setup/algorithm/target/release/verify

derivation verify bin path：MPC-Setup/algorithm/target/release/derivation_verify


# 3 Run

## 3.0 setup help

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



## 3.1 Run setup by the first participant

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



## 3.2 Run setup by other participants(except the first one)
Download previous participant's data and run setup.

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



## 3.3 Full verify help

Full verification includes two parts：derivation verification and consistence verification.

Server and participants should take the full verification. And full verification needs current and previous participants' full file data.

Other verifiers could take derivation verification. And derivation verification only needs current and previous participants' file0.dat.

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



## 3.4 Run full verification for the first participant.
Download the first participant's data and run verify.

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



## 3.4 Run full verification for the other participants(except the first one).
Download current and previous participants' data and run verify.

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

# 4 Other verifiers: Run Derivation Verification.

## 4.1 Run derivation verify for the first participant.

Download the current participant's file0.dat.

```shell
$ ./derivation_verify --input ./test1

Derivation verify success!
```

## 4.2 Run derivation verification for other participants(except the first one).

Download current and previous participants' file0.dat.

```shell
$ ./derivation_verify --input ./test2 --previous ./test1

Derivation verify success!
```