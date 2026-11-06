use super::*;
use soroban_sdk::{testutils::Address as _, vec};

fn setup(env: &Env) -> (MultisigContractClient<'_>, Address, Address, Address) {
    env.mock_all_auths();
    let (a, b, c) = (Address::generate(env), Address::generate(env), Address::generate(env));
    let signers = vec![env, a.clone(), b.clone(), c];
    let id = env.register(MultisigContract, (signers, 2u32));
    (MultisigContractClient::new(env, &id), a, b, Address::generate(env))
}

#[test]
fn reaches_threshold_with_two_signers() {
    let env = Env::default();
    let (client, a, b, _) = setup(&env);
    let id = client.propose(&a);
    assert!(!client.is_approved(&id));
    assert!(client.approve(&b, &id));
}

#[test]
fn outsider_cannot_propose_or_approve() {
    let env = Env::default();
    let (client, a, _, outsider) = setup(&env);
    assert_eq!(client.try_propose(&outsider), Err(Ok(Error::NotASigner)));
    let id = client.propose(&a);
    assert_eq!(client.try_approve(&outsider, &id), Err(Ok(Error::NotASigner)));
}

#[test]
fn same_signer_cannot_approve_twice() {
    let env = Env::default();
    let (client, a, _, _) = setup(&env);
    let id = client.propose(&a);
    assert_eq!(client.try_approve(&a, &id), Err(Ok(Error::AlreadyApproved)));
    assert!(!client.is_approved(&id));
}
