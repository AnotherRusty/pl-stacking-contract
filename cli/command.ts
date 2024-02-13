import { program } from 'commander';
import {
    PublicKey
} from '@solana/web3.js';
import { changeAdmin, getGlobalInfo, initProject, lockPnft, setClusterConfig, unlockPnft } from './scripts';

program.version('0.0.1');

programCommand('status')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .action(async (directory, cmd) => {
        const { env, keypair, rpc } = cmd.opts();

        console.log('Solana Cluster:', env);
        console.log('Keypair Path:', keypair);
        console.log('RPC URL:', rpc);
        await setClusterConfig(env, keypair, rpc);

        console.log(await getGlobalInfo());
    });

programCommand('init')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .action(async (directory, cmd) => {
        const { env, keypair, rpc } = cmd.opts();

        console.log('Solana Cluster:', env);
        console.log('Keypair Path:', keypair);
        console.log('RPC URL:', rpc);

        await setClusterConfig(env, keypair, rpc);

        await initProject();
    });


programCommand('change-admin')
    .option('-n, --new_admin <string>', 'new admin address')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .action(async (directory, cmd) => {
        const { env, keypair, rpc, new_admin } = cmd.opts();

        console.log('Solana Cluster:', env);
        console.log('Keypair Path:', keypair);
        console.log('RPC URL:', rpc);
        await setClusterConfig(env, keypair, rpc);

        if (new_admin === undefined) {
            console.log("Error New Admin Input");
            return;
        }

        //  update global info
        await changeAdmin(new_admin);
    });

programCommand('lock')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .option('-m, --mint <number>')
    .action(async (directory, cmd) => {
        const { env, keypair, rpc, mint } = cmd.opts();

        console.log('Solana Cluster:', env);
        console.log('Keypair Path:', keypair);
        console.log('RPC URL:', rpc);

        await setClusterConfig(env, keypair, rpc);
        if (mint === undefined) {
            console.log("Error token amount Input");
            return;
        }

        await lockPnft(new PublicKey(mint));
    });

programCommand('unlock')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .option('-m, --mint <number>')
    .action(async (directory, cmd) => {
        const { env, keypair, rpc, mint } = cmd.opts();

        console.log('Solana Cluster:', env);
        console.log('Keypair Path:', keypair);
        console.log('RPC URL:', rpc);

        await setClusterConfig(env, keypair, rpc);
        if (mint === undefined) {
            console.log("Error token amount Input");
            return;
        }

        await unlockPnft(new PublicKey(mint));
    });

function programCommand(name: string) {
    return program
        .command(name)
        .option('-e, --env <string>', 'Solana cluster env name', 'mainnet-beta') //mainnet-beta, testnet, devnet
        .option('-r, --rpc <string>', 'Solana cluster RPC name', 'https://solana-mainnet.g.alchemy.com/v2/wsOJ8IVuGPfyljRfcZjpLrsVQu0_of-j')
        .option('-k, --keypair <string>', 'Solana wallet Keypair Path', '../key/G2.json')
}

program.parse(process.argv);

/*

yarn script init
yarn script change-admin -n J9ja5QkewwMi9kG6JkCNxfLK9CoDGk3F4hZTNKQaKZe3
yarn script lock -m AXXfo3sggcMLNvz3zRS2wJz8xy78DFbxmgcsUYkM5TzQ -k ../key/G2.json

yarn script unlock -m AXXfo3sggcMLNvz3zRS2wJz8xy78DFbxmgcsUYkM5TzQ -k ../key/G2.json

yarn script user-status -a G2sc5mU3eLRkbRupnupzB3NTzZ85bnc9L1ReAre9dzFU
yarn script user-status -a 4EjZ4sGnvfLbW89AAzSehob7Rmkym7vCH3SMcThSx9q1

yarn script get-users
yarn script status

*/
