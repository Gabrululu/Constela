// {{intro}}
#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    StillLocked = 2,
    NothingToWithdraw = 3,
}

#[contracttype]
pub enum DataKey {
    Token,
    UnlockTime,
    Balance(Address),
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// {{constructor_doc}}
    pub fn __constructor(env: Env, token: Address, unlock_time: u64) {
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::UnlockTime, &unlock_time);
    }

    /// {{deposit_doc}}
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_id).transfer(&from, &env.current_contract_address(), &amount);
        let key = DataKey::Balance(from);
        let saved: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(saved + amount));
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        Ok(())
    }

    /// {{withdraw_doc}}
    pub fn withdraw(env: Env, to: Address) -> Result<i128, Error> {
        to.require_auth();
        let unlock: u64 = env.storage().instance().get(&DataKey::UnlockTime).unwrap();
        if env.ledger().timestamp() < unlock {
            return Err(Error::StillLocked);
        }
        let key = DataKey::Balance(to.clone());
        let saved: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if saved == 0 {
            return Err(Error::NothingToWithdraw);
        }
        // {{order_note}}
        env.storage().persistent().remove(&key);
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_id).transfer(&env.current_contract_address(), &to, &saved);
        Ok(saved)
    }

    pub fn balance(env: Env, account: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(account)).unwrap_or(0)
    }
}
