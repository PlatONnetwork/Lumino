#!/bin/sh

dir=$(pwd)
mkdir test1
mkdir test2
mkdir test3

cargo run --release --bin setup --features bn_curve -- --output "${dir}/test1" -g

cargo run --release --bin setup --features bn_curve -- --output "${dir}/test2" --input "${dir}/test1"

cargo run --release --bin setup --features bn_curve -- --output "${dir}/test3" --input "${dir}/test2"

cargo run --release --bin plonk_crs_tool --features bn_curve -- --input "${dir}/test3" --size 16

rm -rf test1 test2 test3