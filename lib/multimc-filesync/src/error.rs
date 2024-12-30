use std::fmt;

#[derive(Debug, PartialEq, Eq)]
pub enum ErrorKind {
    /// Errors related to GDrive communication
    GDrive,

    /// Errors related to the MultiMC Filesync logic
    FileSync,

    /// Errors related to serialization mismatches
    Serialization
}

#[derive(Debug, PartialEq, Eq)]
pub struct Error {
    pub message: String,
    pub kind: ErrorKind
}

impl Error {
    pub fn new<T: AsRef<str>> ( kind: ErrorKind, message: T ) -> Self {
        Self { kind, message: message.as_ref().to_string() }
    }
}

impl fmt::Display for Error {
    fn fmt( &self, f: &mut fmt::Formatter ) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

#[doc(hidden)]
impl From<drive_v3::Error> for Error {
    fn from( error: drive_v3::Error ) -> Self {
        Self {
            kind: ErrorKind::GDrive,
            message: error.message
        }
    }
}

#[doc(hidden)]
impl From<serde_json::Error> for Error {
    fn from( error: serde_json::Error ) -> Self {
        Self {
            kind: ErrorKind::Serialization,
            message: error.to_string()
        }
    }
}