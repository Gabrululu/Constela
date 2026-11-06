// {{intro}}
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

const TTL_THRESHOLD: u32 = 17_280; // {{ttl_note}}
const TTL_EXTEND: u32 = 518_400;

#[contracttype]
pub enum DataKey {
    Admin,
    Count,
}

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    /// {{constructor_doc}}
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// {{increment_doc}}
    pub fn increment(env: Env) -> u32 {
        let count: u32 = env.storage().instance().get(&DataKey::Count).unwrap_or(0) + 1;
        env.storage().instance().set(&DataKey::Count, &count);
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        count
    }

    /// {{get_doc}}
    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }

    /// {{reset_doc}}
    pub fn reset(env: Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Count, &0u32);
    }
}
