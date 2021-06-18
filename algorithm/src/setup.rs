use crate::auxiliary::{FileG1, FileHeader, FirstFile};
use crate::generate::{
    compute_and_write_first_file, compute_and_write_subsequent_file, generate_rng, get_file_name,
};
use crate::parameters::{get_default_g1_num, get_points_per_file};
use bellman::pairing::ff::{Field, PrimeField};
use bellman::pairing::*;
// use indicatif::{ProgressBar, ProgressStyle};
use rand::{Rand, Rng, SeedableRng};
use std::fs::OpenOptions;
use std::io::{self, Read, Write};
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;
use std::time::Instant;

/// Setup initial, only for the first participant
pub fn setup_init<E: Engine>(
    output_dir: &PathBuf,
    length_g1: &Option<usize>,
    user_random_str: &Option<String>,
) {
    #[cfg(feature = "time_log")]
    let start = std::time::Instant::now();

    let g1_num = if let Some(num) = length_g1 {
        *num
    } else {
        get_default_g1_num()
    };

    let num_per_file = get_points_per_file();
    let g1_file_num = (g1_num + num_per_file - 1) / num_per_file;

    let random = if let Some(input_random) = user_random_str {
        // Hash user input random str to Fr
        let mut rng = generate_rng(input_random);
        E::Fr::rand(&mut rng)
    } else {
        // Use default random Fr
        let mut rng = rand::thread_rng();
        E::Fr::rand(&mut rng)
    };

    // Print log
    {
        print!("creating 0:{}", FirstFile::<E>::get_size());
        for i in 1..(g1_file_num + 1) {
            let file_header = FileHeader::new(0, i, g1_file_num, g1_num);
            print!(" {}:{}", file_header.file_idx, FileG1::<E>::get_size(&file_header));
        }
        print!("\n");
    }

    // Process file 0
    {
        // Compute file 0
        compute_and_write_first_file::<E>(
            0,
            g1_file_num,
            random,
            &E::G1Affine::one(),
            &E::G2Affine::one(),
            output_dir,
        );
    }

    // Process the other files
    {
        // ProgressBar
        // let pb = ProgressBar::new(g1_file_num as u64);
        // let sty = ProgressStyle::default_bar()
        //     .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos:>7}/{len:7} {msg}")
        //     .progress_chars("##-");
        // pb.set_style(sty);
        // pb.set_message(&format!("File #{}", 0));
        // pb.inc(1);

        // Compute and write file i
        for i in 1..(g1_file_num + 1) {
            let file_header = FileHeader::new(0, i, g1_file_num, g1_num);
            let pre_g1_vec = vec![E::G1Affine::one(); file_header.cur_file_g1_point_num];
            compute_and_write_subsequent_file::<E>(random, &pre_g1_vec, &file_header, &output_dir);

            // ProgressBar increase
            // pb.set_message(&format!("File #{}", i));
            // pb.inc(1);
        }

        // pb.finish_with_message("done");
    }

    #[cfg(feature = "time_log")]
    println!("setup init total time: {:?}", start.elapsed());
}

/// Setup, for the other participants except the first one
pub fn setup<E: Engine>(
    input_dir: &PathBuf,
    output_dir: &PathBuf,
    length_g1: &Option<usize>,
    user_random_str: &Option<String>,
) {
    #[cfg(feature = "time_log")]
    let start = std::time::Instant::now();

    let g1_num = if let Some(num) = length_g1 {
        *num
    } else {
        get_default_g1_num()
    };

    let num_per_file = get_points_per_file();
    let g1_file_num = (g1_num + num_per_file - 1) / num_per_file;

    let random = if let Some(input_random) = user_random_str {
        // Hash user input random str to Fr
        let mut rng = generate_rng(input_random);
        E::Fr::rand(&mut rng)
    } else {
        // Use default random Fr
        let mut rng = rand::thread_rng();
        E::Fr::rand(&mut rng)
    };

    // Print log
    {
        print!("creating 0:{}", FirstFile::<E>::get_size());
        for i in 1..(g1_file_num + 1) {
            let file_header = FileHeader::new(0, i, g1_file_num, g1_num);
            print!(" {}:{}", file_header.file_idx, FileG1::<E>::get_size(&file_header));
        }
        print!("\n");
    }

    // Process file 0
    {
        // Read previous file 0
        let pre_file_name = get_file_name(input_dir, 0);
        let file_in = OpenOptions::new()
            .read(true)
            .open(pre_file_name)
            .expect("unable open file");

        // TBD: use BufReader::with_capacity
        let pre_file =
            FirstFile::<E>::read(&mut BufReader::new(file_in)).expect("Invalid file data");

        // Compute and write current file 0
        let cur_idx = pre_file.participant_idx + 1;
        compute_and_write_first_file::<E>(
            cur_idx,
            g1_file_num,
            random,
            &pre_file.g1,
            &pre_file.g2,
            output_dir,
        );
    }

    // Process the other files
    {
        // ProgressBar
        // let pb = ProgressBar::new(g1_file_num as u64);
        // let sty = ProgressStyle::default_bar()
        //     .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos:>7}/{len:7} {msg}")
        //     .progress_chars("##-");
        // pb.set_style(sty);
        // pb.set_message(&format!("File #{}", 0));
        // pb.inc(1);

        // Compute and write file i
        for i in 1..(g1_file_num + 1) {
            // Read previous file i
            let pre_file_name = get_file_name(input_dir, i);
            let file_in = OpenOptions::new()
                .read(true)
                .open(pre_file_name)
                .expect("unable open file");
            let mut reader = BufReader::with_capacity(1 << 26, file_in);
            let pre_file = FileG1::<E>::read(&mut reader).expect("Invalid file data");

            let cur_file_header = FileHeader::new_from_pre(&pre_file.header);
            compute_and_write_subsequent_file::<E>(
                random,
                &pre_file.content,
                &cur_file_header,
                &output_dir,
            );

            // ProgressBar increase
            // pb.set_message(&format!("File #{}", i));
            // pb.inc(1);
        }

        // pb.finish_with_message("done");
    }

    #[cfg(feature = "time_log")]
    println!("setup total time: {:?}", start.elapsed());
}

#[test]
fn test_setup_init() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;
    use bls12_381::G2Affine;

    let path = PathBuf::from("./test_dir_init");
    if !path.exists() {
        std::fs::create_dir(&path).expect("create file previous fail");
    }

    let length_g1 = 2 * get_points_per_file() + 10;
    let user_random_str = &Some(String::from("123"));
    let mut rng_init = generate_rng(&String::from("123"));
    let random = Fr::rand(&mut rng_init);
    setup_init::<Bls12>(&path, &Some(length_g1), user_random_str);

    // Test file 0
    let file_name = get_file_name(&path, 0);
    let file_in = OpenOptions::new()
        .read(true)
        .open(file_name)
        .expect("unable open file");
    let file_0 = FirstFile::<Bls12>::read(&mut BufReader::new(file_in)).unwrap();

    assert_eq!(file_0.participant_idx, 0);
    assert_eq!(file_0.g1_file_num, 3);
    let g1 = G1Affine::one().mul(random).into_affine();
    let g2 = G2Affine::one().mul(random).into_affine();
    let g2_verify = G2Affine::one().mul(random).into_affine();
    assert_eq!(file_0.g1, g1);
    assert_eq!(file_0.g2, g2);
    assert_eq!(file_0.g2_verify, g2_verify);

    // Test file 1-3
    for i in 1..file_0.g1_file_num + 1 {
        let file_name = get_file_name(&path, i);
        let file_in = OpenOptions::new()
            .read(true)
            .open(file_name)
            .expect("unable open file");
        let file = FileG1::<Bls12>::read(&mut BufReader::new(file_in)).unwrap();

        assert_eq!(file.header.participant_idx, 0);
        assert_eq!(file.header.file_idx, i);
        assert_eq!(file.header.total_file_num, 3);
        assert_eq!(file.header.total_g1_point_num, length_g1);

        if file.is_last_file() {
            assert_eq!(file.header.cur_file_g1_point_num, 10);
        } else {
            assert_eq!(file.header.cur_file_g1_point_num, get_points_per_file());
        }

        assert_eq!(
            file.header.g1_point_offset,
            (i - 1) * get_points_per_file() + 1
        );

        let mut target = Vec::new();
        for j in 0..file.header.cur_file_g1_point_num {
            let exp = random.pow(&[(j + file.header.g1_point_offset) as u64]);
            let tmp = G1Affine::one().mul(exp).into_affine();
            target.push(tmp);
        }

        assert_eq!(target, file.content);
    }

    std::fs::remove_dir_all(&path).unwrap();
}

#[test]
fn test_setup() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;
    use bls12_381::G2Affine;

    let init_path = PathBuf::from("./test_dir_init2");
    if !init_path.exists() {
        std::fs::create_dir(&init_path).expect("create file previous fail");
    }

    let setup_path = PathBuf::from("./test_dir_setup");
    if !setup_path.exists() {
        std::fs::create_dir(&setup_path).expect("create file previous fail");
    }

    // Init
    let length_g1 = 2 * get_points_per_file() + 10;
    let init_user_random_str = &Some(String::from("123"));
    let mut rng_init = generate_rng(&String::from("123"));
    let random_init = Fr::rand(&mut rng_init);

    let user_random_str = &Some(String::from("456"));
    let mut rng_init = generate_rng(&String::from("456"));
    let random = Fr::rand(&mut rng_init);
    setup_init::<Bls12>(&init_path, &Some(length_g1), init_user_random_str);

    // Setup
    setup::<Bls12>(&init_path, &setup_path, &Some(length_g1), user_random_str);

    // Test file0
    let setup_file_name = get_file_name(&setup_path, 0);
    let setup_file_in = OpenOptions::new()
        .read(true)
        .open(setup_file_name)
        .expect("unable open file");
    let setup_file_0 = FirstFile::<Bls12>::read(&mut BufReader::new(setup_file_in)).unwrap();

    assert_eq!(setup_file_0.participant_idx, 1);
    assert_eq!(setup_file_0.g1_file_num, 3);
    let g1 = G1Affine::one()
        .mul(random_init)
        .into_affine()
        .mul(random)
        .into_affine();
    let g2 = G2Affine::one()
        .mul(random_init)
        .into_affine()
        .mul(random)
        .into_affine();
    let g2_verify = G2Affine::one().mul(random).into_affine();
    assert_eq!(setup_file_0.g1, g1);
    assert_eq!(setup_file_0.g2, g2);
    assert_eq!(setup_file_0.g2_verify, g2_verify);

    // Test file1--3
    for i in 1..setup_file_0.g1_file_num + 1 {
        let file_name = get_file_name(&setup_path, i);
        let file_in = OpenOptions::new()
            .read(true)
            .open(file_name)
            .expect("unable open file");
        let file = FileG1::<Bls12>::read(&mut BufReader::new(file_in)).unwrap();

        assert_eq!(file.header.participant_idx, 1);
        assert_eq!(file.header.file_idx, i);
        assert_eq!(file.header.total_file_num, 3);
        assert_eq!(file.header.total_g1_point_num, length_g1);

        if file.is_last_file() {
            assert_eq!(file.header.cur_file_g1_point_num, 10);
        } else {
            assert_eq!(file.header.cur_file_g1_point_num, get_points_per_file());
        }

        assert_eq!(
            file.header.g1_point_offset,
            (i - 1) * get_points_per_file() + 1
        );

        let mut target = Vec::new();
        for j in 0..file.header.cur_file_g1_point_num {
            let exp1 = random_init.pow(&[(j + file.header.g1_point_offset) as u64]);
            let exp2 = random.pow(&[(j + file.header.g1_point_offset) as u64]);
            let tmp = G1Affine::one()
                .mul(exp1)
                .into_affine()
                .mul(exp2)
                .into_affine();
            target.push(tmp);
        }

        assert_eq!(target, file.content);
    }

    std::fs::remove_dir_all(&init_path).unwrap();
    std::fs::remove_dir_all(&setup_path).unwrap();
}
