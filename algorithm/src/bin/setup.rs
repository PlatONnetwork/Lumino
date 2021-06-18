use mpc_crs::setup::{setup, setup_init};
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
    /// First participant
    #[structopt(short, long)]
    genesis: bool,

    /// Input path
    #[structopt(short, long)]
    input: Option<String>,

    /// Output path
    #[structopt(short, long)]
    output: String,

    /// Num of g1
    #[structopt(short, long)]
    num: Option<usize>,

    /// Random string
    #[structopt(short, long)]
    random: Option<String>,
}

fn main() {
    let opt = Opt::from_args();

    let output_path = PathBuf::from(&opt.output);
    assert!(
        output_path.exists(),
        "output path \'{}\' doesn't exist",
        output_path.display()
    );

    if opt.genesis {
        // First participant
        println!("You are the first participant!");

        // Run initial setup
        setup_init::<Engine>(&output_path, &opt.num, &opt.random);
    } else {
        // Not first participant
        if let Some(path_str) = opt.input {
            let input_path = PathBuf::from(&path_str);
            assert!(
                input_path.exists(),
                "input path \'{}\' doesn't exist",
                input_path.display()
            );
            assert_ne!(
                input_path, output_path,
                "Input path and output path must be different!"
            );

            // Run setup
            setup::<Engine>(&input_path, &output_path, &opt.num, &opt.random);
        } else {
            println!("Please add output path. For more information try --help");
            std::process::exit(0);
        }
    }

    println!("Setup success");
}
