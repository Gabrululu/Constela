// {{intro}}
#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, Vec};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    InvalidThreshold = 1,
    NotASigner = 2,
    AlreadyApproved = 3,
    UnknownProposal = 4,
}

#[contracttype]
pub enum DataKey {
    Signers,
    Threshold,
    ProposalCount,
    Approvals(u32),
}

fn require_signer(env: &Env, who: &Address) -> Result<(), Error> {
    let signers: Vec<Address> = env.storage().instance().get(&DataKey::Signers).unwrap();
    if signers.contains(who) {
        Ok(())
    } else {
        Err(Error::NotASigner)
    }
}

#[contract]
pub struct MultisigContract;

#[contractimpl]
impl MultisigContract {
    /// {{constructor_doc}}
    pub fn __constructor(env: Env, signers: Vec<Address>, threshold: u32) {
        if threshold == 0 || threshold > signers.len() {
            panic_with_error!(&env, Error::InvalidThreshold);
        }
        env.storage().instance().set(&DataKey::Signers, &signers);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
    }

    /// {{propose_doc}}
    pub fn propose(env: Env, proposer: Address) -> Result<u32, Error> {
        proposer.require_auth();
        require_signer(&env, &proposer)?;
        let id: u32 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0) + 1;
        env.storage().instance().set(&DataKey::ProposalCount, &id);
        let approvals = Vec::from_array(&env, [proposer]);
        env.storage().persistent().set(&DataKey::Approvals(id), &approvals);
        env.storage().persistent().extend_ttl(&DataKey::Approvals(id), TTL_THRESHOLD, TTL_EXTEND);
        env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND);
        Ok(id)
    }

    /// {{approve_doc}}
    pub fn approve(env: Env, signer: Address, proposal: u32) -> Result<bool, Error> {
        signer.require_auth();
        require_signer(&env, &signer)?;
        let key = DataKey::Approvals(proposal);
        let mut approvals: Vec<Address> = env.storage().persistent().get(&key).ok_or(Error::UnknownProposal)?;
        // {{duplicate_note}}
        if approvals.contains(&signer) {
            return Err(Error::AlreadyApproved);
        }
        approvals.push_back(signer);
        env.storage().persistent().set(&key, &approvals);
        env.storage().persistent().extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        Self::is_approved(env, proposal)
    }

    /// {{is_approved_doc}}
    pub fn is_approved(env: Env, proposal: u32) -> Result<bool, Error> {
        let approvals: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Approvals(proposal))
            .ok_or(Error::UnknownProposal)?;
        let threshold: u32 = env.storage().instance().get(&DataKey::Threshold).unwrap();
        Ok(approvals.len() >= threshold)
    }
}
