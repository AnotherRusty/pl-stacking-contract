import * as anchor from '@project-serum/anchor';
import {
    PublicKey,
    Keypair,
    Connection,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID as TOKEN_AUTH_RULES_ID } from "@metaplex-foundation/mpl-token-auth-rules";

import { METAPLEX, MPL_DEFAULT_RULE_SET, findTokenRecordPda, getAssociatedTokenAccount, getMasterEdition, getMetadata } from './util';
import { ADMIN_ADDRESS, GLOBAL_AUTHORITY_SEED, USER_POOL_SEED } from './constant';

export const createInitializeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId);
    console.log("globalPool: ", globalPool.toBase58());

    const txId = await program.methods
        .initialize()
        .accounts({
            admin: userAddress,
            globalPool,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .transaction();

    return txId;
}

/**
 * Change admin of the program
 */
export const changeAdminTx = async (
    admin: PublicKey,
    newAdminAddr: PublicKey,
    program: anchor.Program
) => {
    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId);

    const tx = await program.methods
        .changeAdmin(newAdminAddr)
        .accounts({
            admin,
            globalPool
        })
        .transaction();

    return tx;
}

export const createInitUserTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [userPool, bump] = PublicKey.findProgramAddressSync(
        [userAddress.toBuffer(), Buffer.from(USER_POOL_SEED)],
        program.programId);

    console.log("userPool: ", userPool.toBase58());

    const txId = await program.methods
        .initUser()
        .accounts({
            user: userAddress,
            userPool,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        })
        .transaction();

    return txId;
}

export const createLockPnftTx = async (
    wallet: Wallet,
    nftMint: PublicKey,
    program: anchor.Program,
    connection: Connection
) => {
    const userAddress = wallet.publicKey;

    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId);
    console.log("globalPool: ", globalPool.toBase58());

    const [userPool, _user_bump] = PublicKey.findProgramAddressSync(
        [userAddress.toBuffer(), Buffer.from(USER_POOL_SEED)],
        program.programId);
    console.log("userPool: ", userPool.toBase58());

    const nftEdition = await getMasterEdition(nftMint);
    console.log("nftEdition: ", nftEdition.toBase58());

    let tokenAccount = await getAssociatedTokenAccount(userAddress, nftMint);
    console.log("tokenAccount: ", tokenAccount.toBase58());

    const mintMetadata = await getMetadata(nftMint);
    console.log("mintMetadata: ", mintMetadata.toBase58());

    const tokenMintRecord = findTokenRecordPda(nftMint, tokenAccount);
    console.log("tokenMintRecord: ", tokenMintRecord.toBase58());

    const tx = new Transaction();

    let poolAccount = await connection.getAccountInfo(userPool);
    if (poolAccount === null || poolAccount.data === null) {
        console.log("init User Pool");
        const tx_initUserPool = await createInitUserTx(userAddress, program);
        tx.add(tx_initUserPool);
    }

    const txId = await program.methods
        .lockPnft()
        .accounts({
            admin: ADMIN_ADDRESS,
            globalPool,
            tokenAccount,
            tokenMint: nftMint,
            tokenMintEdition: nftEdition,
            tokenMintRecord,
            mintMetadata,
            authRules: MPL_DEFAULT_RULE_SET,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            signer: userAddress,
            userPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX,
            authRulesProgram: TOKEN_AUTH_RULES_ID,
            systemProgram: SystemProgram.programId
        })
        .transaction();

    tx.add(txId);

    tx.feePayer = userAddress;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const txData = await wallet.signTransaction(tx);

    console.log("signed user: ", userAddress.toBase58());

    return txData.serialize({ requireAllSignatures: false });
}

export const createUnlockPnftTx = async (
    wallet: Wallet,
    nftMint: PublicKey,
    program: anchor.Program,
    connection: Connection
) => {
    const userAddress = wallet.publicKey;

    const [globalPool, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId);
    console.log("globalPool: ", globalPool.toBase58());

    const [userPool, _user_bump] = PublicKey.findProgramAddressSync(
        [userAddress.toBuffer(), Buffer.from(USER_POOL_SEED)],
        program.programId);
    console.log("userPool: ", userPool.toBase58());

    const nftEdition = await getMasterEdition(nftMint);
    console.log("nftEdition: ", nftEdition.toBase58());

    let tokenAccount = await getAssociatedTokenAccount(userAddress, nftMint);
    console.log("tokenAccount: ", tokenAccount.toBase58());

    const mintMetadata = await getMetadata(nftMint);
    console.log("mintMetadata: ", mintMetadata.toBase58());

    const tokenMintRecord = findTokenRecordPda(nftMint, tokenAccount);
    console.log("tokenMintRecord: ", tokenMintRecord.toBase58());

    const tx = new Transaction();

    const txId = await program.methods
        .unlockPnft()
        .accounts({
            admin: ADMIN_ADDRESS,
            globalPool,
            tokenAccount,
            tokenMint: nftMint,
            tokenMintEdition: nftEdition,
            tokenMintRecord,
            mintMetadata,
            authRules: MPL_DEFAULT_RULE_SET,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            signer: userAddress,
            userPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX,
            authRulesProgram: TOKEN_AUTH_RULES_ID,
            systemProgram: SystemProgram.programId
        })
        .transaction();

    tx.add(txId);
    
    tx.feePayer = userAddress;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const txData = await wallet.signTransaction(tx);

    console.log("signed user: ", userAddress.toBase58());

    return txData.serialize({ requireAllSignatures: false });
}
