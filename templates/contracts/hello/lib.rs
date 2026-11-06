// {{intro}}
#![no_std]
use soroban_sdk::{contract, contractimpl, vec, Env, String, Vec};

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    /// {{hello_doc}}
    pub fn hello(env: Env, to: String) -> Vec<String> {
        vec![&env, String::from_str(&env, "{{greeting}}"), to]
    }
}
