use crate::auxiliary::{FileG1, FileHeader, FirstFile};
use crate::error::MpcCeremonyError;
use crate::generate::get_file_name;
use bellman::pairing::ff::{Field, PrimeField};
use bellman::pairing::*;
// use indicatif::{ProgressBar, ProgressStyle};
use rand::{Rand, SeedableRng};
use std::fs::OpenOptions;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

pub fn same_ratio<E: Engine>(
    g1: (E::G1Affine, E::G1Affine),
    g2: (E::G2Affine, E::G2Affine),
) -> bool {
    g1.0.pairing_with(&g2.1) == g1.1.pairing_with(&g2.0)
}

pub fn compute_scalars<E: Engine>(challenge: &E::Fr, length: usize, offset: usize) -> Vec<E::Fr> {
    let mut powers: Vec<E::Fr> = vec![E::Fr::zero(); length];
    let chunk_size = length / num_cpus::get();

    crossbeam::scope(|scope| {
        for (i, powers) in powers.chunks_mut(chunk_size).enumerate() {
            scope.spawn(move || {
                let mut acc = challenge.pow(&[(offset + i * chunk_size) as u64]);
                for p in powers.iter_mut() {
                    *p = acc;
                    acc.mul_assign(challenge);
                }
            });
        }
    });

    powers
}

pub fn compute_multi_product<E: Engine>(
    base_vec: &[E::G1Affine],
    exp_vec: &[E::Fr],
) -> Result<E::G1, MpcCeremonyError> {
    if base_vec.len() != exp_vec.len() {
        return Err(MpcCeremonyError::NumNotEqual);
    }

    let chunk_size = (base_vec.len() / num_cpus::get()) + 1;

    let mut sum = E::G1::zero();
    let mut middle_results: Vec<E::G1> = vec![E::G1::zero(); num_cpus::get()];
    crossbeam::scope(|scope| {
        for ((bases, exps), middle_result) in base_vec
            .chunks(chunk_size)
            .zip(exp_vec.chunks(chunk_size))
            .zip(middle_results.iter_mut())
        {
            scope.spawn(move || {
                for (base, exp) in bases.iter().zip(exps.iter()) {
                    let ret = base.mul(exp.into_repr());
                    middle_result.add_assign(&ret);
                }
            });
        }
    });

    for m in middle_results.iter() {
        sum.add_assign(m);
    }

    Ok(sum)
}

pub fn compute_current_file_result<E: Engine>(
    file: &FileG1<E>,
    challenge: &E::Fr,
) -> Result<(E::G1, E::G1), MpcCeremonyError> {
    #[cfg(feature = "time_log")]
    let start = std::time::Instant::now();

    let g1_vec_len = file.content.len();
    if file.header.cur_file_g1_point_num != g1_vec_len {
        return Err(MpcCeremonyError::InvalidFilePointNum);
    }

    // Compute scalar vec
    let powers = compute_scalars::<E>(challenge, g1_vec_len + 1, file.header.g1_point_offset - 1);

    // Compute left: left = x.z + x^2.z^2 + ... + x^(n-1).z^(n-1)
    let left_sum = if file.is_last_file() {
        compute_multi_product::<E>(
            &file.content[..g1_vec_len - 1],
            &powers[1..powers.len() - 1],
        )?
    } else {
        compute_multi_product::<E>(&file.content, &powers[1..])?
    };

    // Compute right: right = x^2.z + ... + x^n.z^(n-1)
    let right_sum = if file.is_first_file() {
        compute_multi_product::<E>(&file.content[1..], &powers[1..powers.len() - 1])?
    } else {
        compute_multi_product::<E>(&file.content, &powers[..g1_vec_len])?
    };

    // Print log
    println!(
        "progress {}",
        file.header.file_idx * 100 / file.header.total_file_num - 1
    );

    #[cfg(feature = "time_log")]
    println!("verify computation time: {:?}", start.elapsed());

    Ok((left_sum, right_sum))
}

// Verify the current transcript 0 is derived from privous
pub fn verify_derivation<E: Engine>(
    current_path: &PathBuf,
    previous_path: &Option<String>,
) -> Result<(), MpcCeremonyError> {
    // Read current file 0
    let cur_first_file_name = get_file_name(current_path, 0);
    let file_in = OpenOptions::new()
        .read(true)
        .open(cur_first_file_name)
        .expect("unable open file");
    let cur_first_file = FirstFile::<E>::read(&mut BufReader::new(file_in)).unwrap();

    // Verify the current transcript 0 is derived from privous, participant 0'first file don't need this test
    if cur_first_file.participant_idx > 0 {
        if let Some(path_str) = previous_path {
            let pre_path = PathBuf::from(&path_str);
            let pre_first_file_name = get_file_name(&pre_path, 0);
            let file_in = OpenOptions::new()
                .read(true)
                .open(pre_first_file_name)
                .expect("unable open file");
            let pre_first_file = FirstFile::<E>::read(&mut BufReader::new(file_in)).unwrap();

            if pre_first_file.g1_file_num != cur_first_file.g1_file_num {
                return Err(MpcCeremonyError::FileNumNotEqual);
            }

            if pre_first_file.participant_idx + 1 != cur_first_file.participant_idx {
                return Err(MpcCeremonyError::WrongParticipantIdx);
            }

            if !same_ratio::<E>(
                (pre_first_file.g1, cur_first_file.g1),
                (E::G2Affine::one(), cur_first_file.g2_verify),
            ) {
                return Err(MpcCeremonyError::DerivationVerifyFailed);
            }
        } else {
            return Err(MpcCeremonyError::InvalidPreviousFilePath);
        }
    }

    // Print log
    println!("progress {}", 1);

    Ok(())
}

// Verify the current file srs powering sequences [x, x^2, ..., x^n] are well formed
// We will construct two sequences, using random challenge z
// 1: left = x.z + x^2.z^2 + ... + x^(n-1).z^(n-1)
// 2: right = x^2.z + ... + x^n.z^(n-1)
// Finally check left*x == right by pairing
pub fn verify_consistence<E: Engine>(current_path: &PathBuf) -> Result<(), MpcCeremonyError> {
    // Read current file 0
    let cur_first_file_name = get_file_name(current_path, 0);
    let file_in = OpenOptions::new()
        .read(true)
        .open(cur_first_file_name)
        .expect("unable open file");
    let cur_first_file = FirstFile::<E>::read(&mut BufReader::new(file_in)).unwrap();

    let mut rng = rand::thread_rng();
    let challenge: E::Fr = E::Fr::rand(&mut rng);
    let mut left_sum = E::G1::zero();
    let mut right_sum = E::G1::zero();

    // ProgressBar
    // let pb = ProgressBar::new(cur_first_file.g1_file_num as u64);
    // let sty = ProgressStyle::default_bar()
    //     .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos:>7}/{len:7} {msg}")
    //     .progress_chars("##-");
    // pb.set_style(sty);
    // pb.set_message(&format!("File #{}", 0));
    // pb.inc(1);

    for i in 1..(cur_first_file.g1_file_num + 1) {
        // Read g1 file i
        let file_name = get_file_name(current_path, i);
        let file_in = OpenOptions::new()
            .read(true)
            .open(file_name)
            .expect("unable open file");
        let mut reader = BufReader::with_capacity(1 << 26, file_in);
        let cur_file = FileG1::<E>::read(&mut reader).expect("read file failed");

        if cur_file.is_first_file() && cur_file.content[0] != cur_first_file.g1 {
            return Err(MpcCeremonyError::InvalidFirstPoint);
        }

        let (ret_left, ret_right) = compute_current_file_result::<E>(&cur_file, &challenge)?;
        left_sum.add_assign(&ret_left);
        right_sum.add_assign(&ret_right);

        // ProgressBar increase
        // pb.set_message(&format!("File #{}", i));
        // pb.inc(1);
    }

    if !same_ratio::<E>(
        (left_sum.into_affine(), right_sum.into_affine()),
        (E::G2Affine::one(), cur_first_file.g2),
    ) {
        return Err(MpcCeremonyError::ConsistenceVerifyFailed);
    }

    // ProgressBar end
    // pb.finish_with_message("done");

    // Print log
    println!("progress {}", 100);

    Ok(())
}

pub fn fully_verify<E: Engine>(
    current_path: &PathBuf,
    previous_path: &Option<String>,
) -> Result<(), MpcCeremonyError> {
    verify_derivation::<E>(current_path, previous_path)?;
    println!("Derivation verify success!");

    verify_consistence::<E>(current_path)?;
    println!("Consistence verify success!");

    Ok(())
}

#[test]
fn test_verify_derivation() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;
    use bls12_381::G2Affine;
    use std::fs::File;

    let first_usr_path = PathBuf::from("./test_dir_one");
    let second_usr_path = PathBuf::from("./test_dir_two");
    if !first_usr_path.exists() {
        std::fs::create_dir(&first_usr_path).expect("create first file fail");
    }
    if !second_usr_path.exists() {
        std::fs::create_dir(&second_usr_path).expect("create second file fail");
    }

    // Construct first user's file
    let g1 = G1Affine::one()
        .mul(Fr::from_str("123").unwrap())
        .into_affine();
    let g2 = G2Affine::one()
        .mul(Fr::from_str("123").unwrap())
        .into_affine();
    let g2_verify = G2Affine::one()
        .mul(Fr::from_str("123").unwrap())
        .into_affine();

    let ret = FirstFile::<Bls12> {
        participant_idx: 0,
        g1_file_num: 3,
        g1: g1,
        g2: g2,
        g2_verify,
    };
    let file_name = get_file_name(&first_usr_path, 0);
    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret.write(&mut writer).expect("write to file failed");

    // Construct right case: second user's file
    let g1_current_true = g1.mul(Fr::from_str("456").unwrap()).into_affine();
    let g2_current_true = g2.mul(Fr::from_str("456").unwrap()).into_affine();
    let g2_verify_current_true = G2Affine::one()
        .mul(Fr::from_str("456").unwrap())
        .into_affine();

    let ret_true = FirstFile::<Bls12> {
        participant_idx: 1,
        g1_file_num: 3,
        g1: g1_current_true,
        g2: g2_current_true,
        g2_verify: g2_verify_current_true,
    };
    let file_name = get_file_name(&second_usr_path, 0);
    let mut writer1 =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret_true.write(&mut writer1).expect("write to file failed");

    // Verify first file
    verify_derivation::<Bls12>(&first_usr_path, &None).unwrap();

    // Verify
    let s = first_usr_path.to_str().unwrap();
    verify_derivation::<Bls12>(&second_usr_path, &Some(s.to_string())).unwrap();

    // Construct false case: second user's file
    let g1_current_false = G1Affine::one()
        .mul(Fr::from_str("789").unwrap())
        .into_affine();
    let g2_current_false = G2Affine::one()
        .mul(Fr::from_str("789").unwrap())
        .into_affine();
    let g2_verify_current_false = G2Affine::one()
        .mul(Fr::from_str("456").unwrap())
        .into_affine();
    let ret_false = FirstFile::<Bls12> {
        participant_idx: 1,
        g1_file_num: 3,
        g1: g1_current_false,
        g2: g2_current_false,
        g2_verify: g2_verify_current_false,
    };
    let file_name = get_file_name(&second_usr_path, 0);
    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret_false.write(&mut writer).expect("write to file failed");

    let ret = verify_derivation::<Bls12>(&second_usr_path, &Some(s.to_string()));
    assert!(ret.is_err());

    std::fs::remove_dir_all(&first_usr_path).unwrap();
    std::fs::remove_dir_all(&second_usr_path).unwrap();
}

#[test]
fn test_verify_consistence() {
    use crate::generate::{
        compute_and_write_first_file, compute_and_write_subsequent_file, get_file_name,
    };
    use crate::parameters::get_points_per_file;
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;
    use bls12_381::G2Affine;
    use std::fs::File;

    let path = PathBuf::from("./test_dir_three");
    if !path.exists() {
        std::fs::create_dir(&path).expect("create file previous fail");
    }

    let length_g1_num = 2 * get_points_per_file() + 10;

    // right case
    let g1 = G1Affine::one()
        .mul(Fr::from_str("456").unwrap())
        .into_affine();
    let g2 = G2Affine::one()
        .mul(Fr::from_str("456").unwrap())
        .into_affine();
    let g2_verify = G2Affine::one()
        .mul(Fr::from_str("456").unwrap())
        .into_affine();

    let ret = FirstFile::<Bls12> {
        participant_idx: 0,
        g1_file_num: 3,
        g1: g1,
        g2: g2,
        g2_verify,
    };
    let file_name = get_file_name(&path, 0);
    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    ret.write(&mut writer).expect("write to file failed");

    let random = Fr::from_str("456").unwrap();
    for i in 1..4 {
        let header = FileHeader::new(1, i, 3, length_g1_num);

        let mut content = Vec::new();

        for i in 0..header.cur_file_g1_point_num {
            let exp = random.pow(&[(i + header.g1_point_offset) as u64]);
            let tmp = G1Affine::one().mul(exp).into_affine();
            content.push(tmp);
        }

        let file = FileG1::<Bls12> { header, content };

        // Write
        let file_name = get_file_name(&path, header.file_idx);
        let mut writer =
            File::create(&file_name).expect("unable to create parameter file in this diretory");
        file.write(&mut writer).expect("write to file failed");
    }

    // Verify
    verify_consistence::<Bls12>(&path).unwrap();

    // false case: modify file2
    {
        let header = FileHeader::new(1, 2, 3, length_g1_num);

        let mut content = Vec::new();

        for i in 0..header.cur_file_g1_point_num {
            // plus extra 1
            let exp = random.pow(&[(i + header.g1_point_offset + 1) as u64]);
            let tmp = G1Affine::one().mul(exp).into_affine();
            content.push(tmp);
        }

        let file = FileG1::<Bls12> { header, content };

        // Write
        let file_name = get_file_name(&path, header.file_idx);
        let mut writer =
            File::create(&file_name).expect("unable to create parameter file in this diretory");
        file.write(&mut writer).expect("write to file failed");

        // Verify
        let ret = verify_consistence::<Bls12>(&path);
        assert!(ret.is_err());
    }

    // false case: modify file1
    {
        let header = FileHeader::new(1, 1, 3, length_g1_num);

        let mut content = Vec::new();

        for i in 0..header.cur_file_g1_point_num {
            // plus extra 1
            let exp = random.pow(&[(i + header.g1_point_offset + 1) as u64]);
            let tmp = G1Affine::one().mul(exp).into_affine();
            content.push(tmp);
        }

        let file = FileG1::<Bls12> { header, content };

        // Write
        let file_name = get_file_name(&path, header.file_idx);
        let mut writer =
            File::create(&file_name).expect("unable to create parameter file in this diretory");
        file.write(&mut writer).expect("write to file failed");

        // Verify
        let ret = verify_consistence::<Bls12>(&path);
        assert!(ret.is_err());
    }

    std::fs::remove_dir_all(&path).unwrap();
}

#[test]
fn test_compute_scalars() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;

    let mut rng = rand::thread_rng();
    let challenge: Fr = Fr::rand(&mut rng);
    let length = 50usize;
    let offset = 10usize;
    let ret = compute_scalars::<Bls12>(&challenge, length, offset);
    let mut target: Vec<Fr> = Vec::new();
    for i in 0..length {
        let power = challenge.pow(&[(offset + i) as u64]);
        target.push(power);
    }

    assert_eq!(ret, target);
}

#[test]
fn test_compute_multi_product() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;

    let mut base_vec: Vec<G1Affine> = Vec::new();
    let mut exp_vec: Vec<Fr> = Vec::new();
    let mut target = G1Affine::zero().into_projective();
    let mut rng = rand::thread_rng();
    for _i in 0..9 {
        let r = Fr::rand(&mut rng);
        let tmp = G1Affine::one().mul(r.into_repr()).into_affine();
        let r2 = Fr::rand(&mut rng);
        let cur_target = tmp.mul(r2.into_repr());
        target.add_assign(&cur_target);

        base_vec.push(tmp);
        exp_vec.push(r2);
    }

    let ret = compute_multi_product::<Bls12>(&base_vec, &exp_vec).unwrap();
    assert_eq!(ret, target);
}
