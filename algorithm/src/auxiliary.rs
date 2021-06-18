use crate::parameters::get_points_per_file;
use bellman::pairing::*;
use byteorder::{BigEndian, ReadBytesExt, WriteBytesExt};
use std::io::{self, Read, Write};
use std::sync::{Arc, Mutex};

pub struct FirstFile<E: Engine> {
    pub participant_idx: usize,
    pub g1_file_num: usize,
    pub g1: E::G1Affine,
    pub g2: E::G2Affine,
    pub g2_verify: E::G2Affine,
}

#[derive(Copy, Clone, Debug)]
pub struct FileHeader {
    pub participant_idx: usize,
    pub file_idx: usize,
    pub total_file_num: usize,
    pub total_g1_point_num: usize,
    pub cur_file_g1_point_num: usize,
    pub g1_point_offset: usize,
}

#[derive(Clone, Debug)]
pub struct FileG1<E: Engine> {
    pub header: FileHeader,
    pub content: Vec<E::G1Affine>,
}

impl FileHeader {
    // g1 file_idx begin from 1
    pub fn new(
        participant_idx: usize,
        file_idx: usize,
        total_file_num: usize,
        total_g1_point_num: usize,
    ) -> Self {
        assert!(file_idx > 0, "file_idx must be larger than 0");
        let cur_file_g1_point_num = if file_idx == total_file_num {
            total_g1_point_num - (file_idx - 1) * get_points_per_file()
        } else {
            get_points_per_file()
        };

        FileHeader {
            participant_idx,
            file_idx,
            total_file_num,
            total_g1_point_num,
            cur_file_g1_point_num,
            g1_point_offset: (file_idx - 1) * get_points_per_file() + 1,
        }
    }

    pub fn new_from_pre(pre: &FileHeader) -> Self {
        FileHeader {
            participant_idx: pre.participant_idx + 1,
            file_idx: pre.file_idx,
            total_file_num: pre.total_file_num,
            total_g1_point_num: pre.total_g1_point_num,
            cur_file_g1_point_num: pre.cur_file_g1_point_num,
            g1_point_offset: pre.g1_point_offset,
        }
    }

    pub fn read<R: Read>(reader: &mut R) -> io::Result<Self> {
        let participant_idx = reader.read_u32::<BigEndian>()? as usize;
        let file_idx = reader.read_u32::<BigEndian>()? as usize;
        let total_file_num = reader.read_u32::<BigEndian>()? as usize;
        let total_g1_point_num = reader.read_u32::<BigEndian>()? as usize;
        let cur_file_g1_point_num = reader.read_u32::<BigEndian>()? as usize;
        let g1_point_offset = reader.read_u32::<BigEndian>()? as usize;

        Ok(Self {
            participant_idx,
            file_idx,
            total_file_num,
            total_g1_point_num,
            cur_file_g1_point_num,
            g1_point_offset,
        })
    }

    pub fn write<W: Write>(&self, writer: &mut W) -> io::Result<()> {
        writer.write_u32::<BigEndian>(self.participant_idx as u32)?;
        writer.write_u32::<BigEndian>(self.file_idx as u32)?;
        writer.write_u32::<BigEndian>(self.total_file_num as u32)?;
        writer.write_u32::<BigEndian>(self.total_g1_point_num as u32)?;
        writer.write_u32::<BigEndian>(self.cur_file_g1_point_num as u32)?;
        writer.write_u32::<BigEndian>(self.g1_point_offset as u32)?;

        Ok(())
    }
}

impl<E: Engine> FileG1<E> {
    pub fn write<W: Write>(&self, writer: &mut W) -> io::Result<()> {
        #[cfg(feature = "time_log")]
        let start = std::time::Instant::now();

        fn write_point_vec<W, G>(writer: &mut W, vec: &Vec<G>) -> io::Result<()>
        where
            W: Write,
            G: CurveAffine,
        {
            for v in vec {
                write_point(writer, v)?;
            }

            Ok(())
        }

        self.header.write(writer)?;
        write_point_vec(writer, &self.content)?;

        #[cfg(feature = "time_log")]
        println!("write file time: {:?}", start.elapsed());

        Ok(())
    }

    pub fn read<R: Read>(reader: &mut R) -> io::Result<Self> {
        #[cfg(feature = "time_log")]
        let start = std::time::Instant::now();

        let header = FileHeader::read(reader)?;
        let point_num = header.cur_file_g1_point_num;

        let mut middle_ret = vec![<E::G1Affine as CurveAffine>::Uncompressed::empty(); point_num];
        for point in &mut middle_ret {
            reader.read_exact(point.as_mut())?;
        }

        let mut content = vec![E::G1Affine::zero(); point_num];
        let has_error = Arc::new(Mutex::new(false));

        let mut chunk_size = point_num / num_cpus::get();
        if chunk_size == 0 {
            chunk_size = 1;
        }

        crossbeam::scope(|scope| {
            for (source, target) in middle_ret
                .chunks(chunk_size)
                .zip(content.chunks_mut(chunk_size))
            {
                let has_error = has_error.clone();
                scope.spawn(move || {
                    for (from, to) in source.iter().zip(target.iter_mut()) {
                        let ret = from
                            // .into_affine()
                            .into_affine_unchecked()
                            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e));
                        if let Ok(ret) = ret {
                            if ret.is_zero() {
                                *has_error.lock().unwrap() = true;
                            }
                            *to = ret;
                        } else {
                            *has_error.lock().unwrap() = true;
                        }
                    }
                });
            }
        });

        if Arc::try_unwrap(has_error).unwrap().into_inner().unwrap() {
            return Err(std::io::Error::new(
                io::ErrorKind::InvalidData,
                "read data failed",
            ));
        }

        #[cfg(feature = "time_log")]
        println!("read file time: {:?}", start.elapsed());

        Ok(Self { header, content })
    }

    pub fn get_size(header: &FileHeader) -> usize {
        let point_size = E::G1Affine::one().into_uncompressed().as_ref().len();

        6 * 4 + header.cur_file_g1_point_num * point_size
    }

    pub fn is_last_file(&self) -> bool {
        if self.header.file_idx == self.header.total_file_num {
            true
        } else {
            false
        }
    }

    pub fn is_first_file(&self) -> bool {
        if self.header.file_idx == 1usize {
            true
        } else {
            false
        }
    }
}

impl<E: Engine> FirstFile<E> {
    pub fn write<W: Write>(&self, writer: &mut W) -> io::Result<()> {
        writer.write_u32::<BigEndian>(self.participant_idx as u32)?;
        writer.write_u32::<BigEndian>(self.g1_file_num as u32)?;
        write_point(writer, &self.g1)?;
        write_point(writer, &self.g2)?;
        write_point(writer, &self.g2_verify)?;

        Ok(())
    }

    pub fn read<R: Read>(reader: &mut R) -> io::Result<Self> {
        let participant_idx = reader.read_u32::<BigEndian>()? as usize;
        let g1_file_num = reader.read_u32::<BigEndian>()? as usize;

        let mut g1_repr = <E::G1Affine as CurveAffine>::Uncompressed::empty();
        reader.read_exact(g1_repr.as_mut())?;
        let g1 = g1_repr
            // .into_affine()
            .into_affine_unchecked()
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

        let mut g2_repr = <E::G2Affine as CurveAffine>::Uncompressed::empty();
        reader.read_exact(g2_repr.as_mut())?;
        let g2 = g2_repr
            // .into_affine()
            .into_affine_unchecked()
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

        reader.read_exact(g2_repr.as_mut())?;
        let g2_verify = g2_repr
            // .into_affine()
            .into_affine_unchecked()
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

        if g1.is_zero() || g2.is_zero() || g2_verify.is_zero() {
            return Err(std::io::Error::new(
                io::ErrorKind::InvalidData,
                "zero point",
            ));
        }

        Ok(Self {
            participant_idx,
            g1_file_num,
            g1,
            g2,
            g2_verify,
        })
    }

    pub fn get_size() -> usize {
        let point1_size = E::G1Affine::one().into_uncompressed().as_ref().len();
        let point2_size = E::G2Affine::one().into_uncompressed().as_ref().len();

        4 + 4 + point1_size + point2_size * 2
    }
}

pub fn write_point<W, G>(writer: &mut W, p: &G) -> io::Result<()>
where
    W: Write,
    G: CurveAffine,
{
    writer.write_all(p.into_uncompressed().as_ref())
}

#[test]
fn test_zero_point() {
    use bellman::pairing::bls12_381::Bls12;
    use bls12_381::Fr;
    use bls12_381::G1Affine;
    use bls12_381::G2Affine;
    use std::fs::File;
    use std::fs::OpenOptions;
    use std::io::{BufReader, BufWriter};
    use std::path::PathBuf;

    let file_name = PathBuf::from("./test_dir_zero_point1.dat");

    let file_1 = FirstFile::<Bls12> {
        participant_idx: 0,
        g1_file_num: 1,
        g1: G1Affine::zero(),
        g2: G2Affine::one(),
        g2_verify: G2Affine::one(),
    };

    let mut writer =
        File::create(&file_name).expect("unable to create parameter file in this diretory");
    file_1.write(&mut writer).expect("write to file failed");

    let file_in = OpenOptions::new()
        .read(true)
        .open(&file_name)
        .expect("unable open file");

    assert!(FirstFile::<Bls12>::read(&mut BufReader::new(file_in)).is_err());

    let file_name2 = PathBuf::from("./test_dir_zero_point2.dat");
    let header = FileHeader::new(1, 1, 1, 1);
    let file_2 = FileG1::<Bls12> {
        header,
        content: vec![G1Affine::zero(); 1usize],
    };

    let mut writer =
        File::create(&file_name2).expect("unable to create parameter file in this diretory");
    file_2.write(&mut writer).expect("write to file failed");

    let file_in = OpenOptions::new()
        .read(true)
        .open(&file_name2)
        .expect("unable open file");

    assert!(FirstFile::<Bls12>::read(&mut BufReader::new(file_in)).is_err());

    std::fs::remove_file(file_name).unwrap();
    std::fs::remove_file(file_name2).unwrap();
}

#[test]
fn test_size() {
    let g1 = bls12_381::G1Affine::one();
    let length = g1.into_uncompressed().as_ref().len();
    println!("bls12: {}", length);

    let g2 = bn256::G1Affine::one();
    let length2 = g2.into_uncompressed().as_ref().len();
    println!("bn: {}", length2);
}
