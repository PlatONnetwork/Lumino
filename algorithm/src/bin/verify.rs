use mpc_crs::verify::fully_verify;
use std::path::PathBuf;
use structopt::StructOpt;
// curve bls12_381
#[cfg(feature = "bls_curve")]
use bellman::pairing::bls12_381::Bls12 as Engine;

// curve bn256
#[cfg(feature = "bn_curve")]
use bellman::pairing::bn256::Bn256 as Engine;

#[derive(StructOpt, Debug)]
#[structopt(name = "mpc_crs", author = "Platon", rename_all = "snake_case")]
struct Opt {
    /// Previous participant transcript 0 file path
    #[structopt(short, long)]
    previous: Option<String>,

    /// Input path
    #[structopt(short, long)]
    input: String,
}

fn main() {
    #[cfg(feature = "time_log")]
    let start = std::time::Instant::now();

    let opt = Opt::from_args();

    let current_path = PathBuf::from(&opt.input);
    assert!(
        current_path.exists(),
        "current path \'{}\' doesn't exist",
        current_path.display()
    );

    fully_verify::<Engine>(&current_path, &opt.previous).unwrap();

    println!("Fully verify success!");

    #[cfg(feature = "time_log")]
    println!("verify total time: {:?}", start.elapsed());
}
