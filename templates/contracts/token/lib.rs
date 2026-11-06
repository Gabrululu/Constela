// {{intro}}
// {{not_sep41}}
#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    InsufficientBalance = 2,
}

#[contracttype]
pub enum DataKey {
    Balance(Address),
    TotalSupply,
}

fn read_balance(env: &Env, account: &Address) -> i128 {
    let key = DataKey::Balance(account.clone());
    let balance = env.storage().persistent().get(&key).unwrap_or(0);
    if balance > 0 {
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
    }
    balance
}

fn write_balance(env: &Env, account: &Address, amount: i128) {
    let key = DataKey::Balance(account.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
}

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    /// {{constructor_doc}}
    pub fn __constructor(env: Env, admin: Address, supply: i128) {
        if supply <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        env.storage().instance().set(&DataKey::TotalSupply, &supply);
        write_balance(&env, &admin, supply);
    }

    pub fn balance(env: Env, account: Address) -> i128 {
        read_balance(&env, &account)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    /// {{transfer_doc}}
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        // {{positive_note}}
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }
        write_balance(&env, &from, from_balance - amount);
        let to_balance = read_balance(&env, &to);
        write_balance(&env, &to, to_balance + amount);
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        Ok(())
    }
}
