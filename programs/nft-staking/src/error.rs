use crate::*;

#[error_code]
pub enum StakingError {
    #[msg("Admin address dismatch")]
    InvalidAdmin,
    #[msg("Max count reached")]
    ExceedMaxCount,
    #[msg("Metadata address is invalid")]
    InvalidMetadata,
    #[msg("Collection is invalid")]
    InvalidCollection,
    #[msg("Can not parse creators in metadata")]
    MetadataCreatorParseError,
    #[msg("Can not find NFT")]
    NftNotExist,
    #[msg("Can not unlock NFT before time")]
    StillLocked,
}
