use crate::*;

/**
 * Global pool stores admin address
 */
#[account]
#[derive(Default)]
pub struct GlobalPool {
    pub admin: Pubkey, //  32
}

impl GlobalPool {
    pub const DATA_SIZE: usize = 32;
}

/**
 * User pool stores user's stake data
 */
#[account]
#[derive(Default)]
pub struct UserPool {
    pub user: Pubkey,   // 32
    pub stake_cnt: u16, // 2
}

impl UserPool {
    pub const DATA_SIZE: usize = 32 + 2;
}
