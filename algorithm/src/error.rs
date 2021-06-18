use thiserror::Error;

/// Represents an error in setup and verify.
#[derive(Error, Clone, Debug, Eq, PartialEq)]
pub enum MpcCeremonyError {
    /// This error occurs when the derivation verification failed.
    #[error("Derivation verification failed.")]
    DerivationVerifyFailed,

    /// This error occurs when the previous file path is invalid.
    #[error("Invalid previous file path.")]
    InvalidPreviousFilePath,

    /// This error occurs when the current file num is not equal to the previous.
    #[error("Current g1 file num is not equal to the previous.")]
    FileNumNotEqual,

    /// This error occurs when the consistence verification failed.
    #[error("Consistence verification failed.")]
    ConsistenceVerifyFailed,

    /// This error occurs when the previous file g1 num is invalid.
    #[error("Current file g1 point num is not valid.")]
    InvalidFilePointNum,

    /// This error occurs when the two vec num is not equal.
    #[error("Vectors num are not equal.")]
    NumNotEqual,

    /// This error occurs when the current participant_idx is not equal to the previous participant_idx plus one.
    #[error("Current participant idx is not equal to the previous plus one.")]
    WrongParticipantIdx,

    /// This error occurs when the first point of file0 and file1 is not equal.
    #[error("First point of file0 and file1 is not equal.")]
    InvalidFirstPoint,
}
