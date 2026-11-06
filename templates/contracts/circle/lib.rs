// {{intro}}
// {{how_it_works}}
// {{limitation}}
#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env, Vec};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidConfig = 1,
    NotAMember = 2,
    AlreadyPaid = 3,
    RoundIncomplete = 4,
    Finished = 5,
}

#[contracttype]
pub enum DataKey {
    Token,
    Contribution,
    Members,
    Round,
    Paid(u32, Address),
    PaidCount(u32),
}

#[contract]
pub struct SavingsCircle;

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
}

fn members(env: &Env) -> Vec<Address> {
    env.storage().instance().get(&DataKey::Members).unwrap()
}

#[contractimpl]
impl SavingsCircle {
    /// {{constructor_doc}}
    pub fn __constructor(env: Env, token: Address, contribution: i128, members: Vec<Address>) {
        if contribution <= 0 || members.len() < 2 {
            panic_with_error!(&env, Error::InvalidConfig);
        }
        // {{unique_note}}
        for (index, member) in members.iter().enumerate() {
            if members.first_index_of(&member) != Some(index as u32) {
                panic_with_error!(&env, Error::InvalidConfig);
            }
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Contribution, &contribution);
        env.storage().instance().set(&DataKey::Members, &members);
        env.storage().instance().set(&DataKey::Round, &0u32);
    }

    /// {{contribute_doc}}
    pub fn contribute(env: Env, member: Address) -> Result<(), Error> {
        member.require_auth();
        let round = Self::round(env.clone());
        if round >= members(&env).len() {
            return Err(Error::Finished);
        }
        if !members(&env).contains(&member) {
            return Err(Error::NotAMember);
        }
        let paid_key = DataKey::Paid(round, member.clone());
        if env.storage().persistent().has(&paid_key) {
            return Err(Error::AlreadyPaid);
        }
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Contribution).unwrap();
        token::Client::new(&env, &token_id).transfer(&member, &env.current_contract_address(), &amount);

        env.storage().persistent().set(&paid_key, &true);
        env.storage().persistent().extend_ttl(&paid_key, TTL_THRESHOLD, TTL_EXTEND);
        let count_key = DataKey::PaidCount(round);
        let count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0) + 1;
        env.storage().persistent().set(&count_key, &count);
        env.storage().persistent().extend_ttl(&count_key, TTL_THRESHOLD, TTL_EXTEND);
        bump(&env);
        Ok(())
    }

    /// {{payout_doc}}
    pub fn payout(env: Env) -> Result<Address, Error> {
        let round = Self::round(env.clone());
        let all = members(&env);
        if round >= all.len() {
            return Err(Error::Finished);
        }
        let count: u32 = env.storage().persistent().get(&DataKey::PaidCount(round)).unwrap_or(0);
        if count < all.len() {
            return Err(Error::RoundIncomplete);
        }
        // {{order_note}}
        env.storage().instance().set(&DataKey::Round, &(round + 1));
        let recipient = all.get_unchecked(round);
        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Contribution).unwrap();
        let pot = amount * i128::from(all.len());
        token::Client::new(&env, &token_id).transfer(&env.current_contract_address(), &recipient, &pot);
        bump(&env);
        Ok(recipient)
    }

    pub fn round(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Round).unwrap_or(0)
    }

    pub fn current_recipient(env: Env) -> Result<Address, Error> {
        members(&env).get(Self::round(env.clone())).ok_or(Error::Finished)
    }

    pub fn paid_count(env: Env) -> u32 {
        let round = Self::round(env.clone());
        env.storage().persistent().get(&DataKey::PaidCount(round)).unwrap_or(0)
    }
}
