#![allow(unused_imports)]

extern crate bellman;
extern crate byteorder;
extern crate crossbeam;
extern crate num_cpus;
extern crate rand;

pub mod auxiliary;
pub mod error;
pub mod generate;
pub mod parameters;
pub mod setup;
pub mod verify;

pub const DEFAULT_G1_NUM: usize = 1 << 26;
pub const POINTS_PER_FILE: usize = 1 << 22;
