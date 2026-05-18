#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Fund a bounty escrow. Stores owner and reward amount.
    pub fn initialize(env: Env, owner: Address, amount: i128) {
        owner.require_auth();
        env.storage().instance().set(&symbol_short!("OWNER"), &owner);
        env.storage().instance().set(&symbol_short!("AMOUNT"), &amount);
    }

    /// Release funds to a contributor.
    pub fn release(env: Env, caller: Address, recipient: Address) {
        caller.require_auth();
        let owner: Address = env.storage().instance().get(&symbol_short!("OWNER")).unwrap();
        assert!(caller == owner, "only owner can release");
        let _amount: i128 = env.storage().instance().get(&symbol_short!("AMOUNT")).unwrap();
        // Token transfer would be wired here via soroban token interface.
        env.storage().instance().set(&symbol_short!("RECIP"), &recipient);
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("OWNER")).unwrap()
    }

    pub fn get_amount(env: Env) -> i128 {
        env.storage().instance().get(&symbol_short!("AMOUNT")).unwrap()
    }
}
