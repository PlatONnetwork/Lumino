#!/bin/sh

dir=$(pwd)
mkdir test1
mkdir test2

cargo run --release --bin setup --features bls_curve,time_log -- --output "${dir}/test1" -g

cargo run --release --bin setup --features bls_curve,time_log -- --output "${dir}/test2" --input "${dir}/test1"

cargo run --release --bin verify --features bls_curve,time_log -- --input "${dir}/test1"

cargo run --release --bin verify --features bls_curve,time_log -- --input "${dir}/test2" --previous "${dir}/test1"
