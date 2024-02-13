import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js'

export interface GlobalPool {
    admin: PublicKey,
}
export interface UserPool {
    user: PublicKey,
    stakeCnt: number,
}

export interface StakeInfo {
    mint: PublicKey,
    time: anchor.BN
}
