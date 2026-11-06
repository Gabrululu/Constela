#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct Warmup;

#[contractimpl]
impl Warmup {
    pub fn ping(_env: Env) -> u32 {
        1
    }
}
