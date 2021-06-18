use crate::auxiliary::{FileG1, FileHeader, FirstFile};
use crate::parameters::get_points_per_file;
use bellman::pairing::ff::{Field, PrimeField};
use bellman::pairing::*;
use byteorder::{BigEndian, ReadBytesExt};
use rand::chacha::ChaChaRng;
use rand::{Rand, Rng, SeedableRng};
use sha256::digest;
use std::fs::File;
use std::path::PathBuf;

// Generate rng from user's input string
pub fn generate_rng(str: &String) -> ChaChaRng {
    let hash = digest(str).into_bytes();
    let mut digest = &hash[..];
    let mut seed = [0u32; 8];
    for i in 0..8 {
        seed[i] = digest
            .read_u32::<BigEndian>()
            .expect("digest is large enough for this to work");
    }

    ChaChaRng::from_seed(&seed)
}

pub fn get_file_name(dir: &PathBuf, num: usize) -> PathBuf {
    let mut out_dir = PathBuf::new();
    out_dir.push(dir);
    out_dir.push(&format!("file_{}.dat", num));

    out_dir
}

pub fn compute_and_write_first_file<E: Engine>(
    participant_idx: usize,
    g1_file_num: usize,
    random: E::Fr,
    pre_g1: &E::G1Affine,
    pre_g2: &E::G2Affine,
    output_dir: &PathBuf,
) {
    // Compute
    let g1 = pre_g1.mul(random).into_affine();
    let g2 = pre_g2.mul(random).into_affine();
    let g2_verify = E::G2Affine::one().mul(random).into_affine();

    let ret = FirstFile::<E> {
        participant_idx,
        g1_file_num,
        g1,
        g2,
        g2_verify,
    };

    // Write
    let file_name = get_file_name(output_dir, 0);
    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret.write(&mut writer).expect("write to file failed");

    // Print log
    let metadata = std::fs::metadata(file_name).expect("get file size failed");
    println!("wrote 0 {}", metadata.len());
    println!("progress 1")
}

pub fn compute_and_write_subsequent_file<E: Engine>(
    random: E::Fr,
    pre_g1_vec: &Vec<E::G1Affine>,
    file_header: &FileHeader,
    output_dir: &PathBuf,
) {
    #[cfg(feature = "time_log")]
    let start = std::time::Instant::now();

    // Compute
    let pre_g1_vec_len = pre_g1_vec.len();
    assert!(
        pre_g1_vec_len <= get_points_per_file(),
        "g1 vec num exceeds the max of file pointers"
    );

    let mut cur_g1_vec = vec![E::G1Affine::zero(); pre_g1_vec_len];
    let mut chunk_size = pre_g1_vec_len / num_cpus::get();
    // assert_ne!(chunk_size, 0, "chunk_size can't be 0");
    if chunk_size == 0 {
        chunk_size = 1;
    }

    crossbeam::scope(|scope| {
        for (i, (pre_vec, cur_vec)) in pre_g1_vec
            .chunks(chunk_size)
            .zip(cur_g1_vec.chunks_mut(chunk_size))
            .enumerate()
        {
            scope.spawn(move || {
                let thread_start = file_header.g1_point_offset + (i * chunk_size);
                let mut rand_pow = random.pow(&[thread_start as u64]);
                for (pre, cur) in pre_vec.iter().zip(cur_vec.iter_mut()) {
                    *cur = pre.mul(rand_pow.into_repr()).into_affine();
                    rand_pow.mul_assign(&random);
                }
            });
        }
    });

    #[cfg(feature = "time_log")]
    println!("setup computation time: {:?}", start.elapsed());

    // Write
    let file_name = get_file_name(output_dir, file_header.file_idx);
    let ret = FileG1::<E> {
        header: *file_header,
        content: cur_g1_vec,
    };
    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret.write(&mut writer).expect("write to file failed");

    // Print log
    let metadata = std::fs::metadata(file_name).expect("get file size failed");
    println!("wrote {} {}", file_header.file_idx, metadata.len());
    println!(
        "progress {}",
        file_header.file_idx * 100 / file_header.total_file_num
    );
}
