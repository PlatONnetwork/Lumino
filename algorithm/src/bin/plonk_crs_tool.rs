use byteorder::{BigEndian, WriteBytesExt};
use mpc_crs::auxiliary::{FileG1, FirstFile};
use mpc_crs::generate::get_file_name;
use mpc_crs::DEFAULT_G1_NUM;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::BufReader;
use std::io::Write;
use std::path::PathBuf;
use structopt::StructOpt;

use bellman::pairing::{CurveAffine, Engine as EngineTrait};
// curve bls12_381
#[cfg(feature = "bls_curve")]
use bellman::pairing::bls12_381::Bls12 as Engine;

// curve bn256
#[cfg(feature = "bn_curve")]
use bellman::pairing::bn256::Bn256 as Engine;

#[derive(StructOpt, Debug)]
#[structopt(name = "mpc_crs", author = "Platon", rename_all = "snake_case")]
struct Opt {
    /// Input path
    #[structopt(short, long)]
    input: String,

    /// Size: power of tow
    #[structopt(short, long)]
    size: usize,
}

fn main() {
    let opt = Opt::from_args();

    let input_path = PathBuf::from(&opt.input);
    assert!(
        input_path.exists(),
        "output path \'{}\' doesn't exist",
        input_path.display()
    );

    let power_of_two = opt.size;
    let num_g1 = 1 << power_of_two;
    assert!(num_g1 >= DEFAULT_G1_NUM, "input a smaller size!");

    // Read current file 0
    let first_file_name = get_file_name(&input_path, 0);
    let file_in = OpenOptions::new()
        .read(true)
        .open(first_file_name)
        .expect("unable open file");
    let first_file = FirstFile::<Engine>::read(&mut BufReader::new(file_in)).unwrap();

    // Get output file
    let output_filename = format!("./setup_2^{}.key", power_of_two);
    let mut writer =
        File::create(&output_filename).expect("unable to create out file in this diretory");

    // write g1 num
    writer
        .write_u64::<BigEndian>(num_g1 as u64)
        .expect("unable to write g1 num");

    // write g1 vec
    writer
        .write_all(
            <<Engine as EngineTrait>::G1Affine as CurveAffine>::one()
                .into_uncompressed()
                .as_ref(),
        )
        .expect("unable to write g1");
    let mut already_write_num = 1;
    for i in 1..(first_file.g1_file_num + 1) {
        if num_g1 == already_write_num {
            break;
        }

        // Read file
        let file_name = get_file_name(&input_path, i);
        let file = OpenOptions::new()
            .read(true)
            .open(file_name)
            .expect("unable open file");
        let mut reader = BufReader::with_capacity(1 << 26, file);
        let file = FileG1::<Engine>::read(&mut reader).expect("Invalid file data");

        for p in file.content {
            writer
                .write_all(p.into_uncompressed().as_ref())
                .expect("unable to write g1");
            already_write_num += 1;
            if num_g1 == already_write_num {
                break;
            }
        }
    }

    // write g2 num
    writer
        .write_u64::<BigEndian>(2 as u64)
        .expect("unable to write g2 num");

    // write g2 vec
    writer
        .write_all(
            <<Engine as EngineTrait>::G2Affine as CurveAffine>::one()
                .into_uncompressed()
                .as_ref(),
        )
        .expect("unable to write g2");
    writer
        .write_all(first_file.g2.into_uncompressed().as_ref())
        .expect("unable to write g2");
}
