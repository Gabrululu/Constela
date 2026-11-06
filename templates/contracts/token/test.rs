use super::*;
use soroban_sdk::testutils::Address as _;

fn setup(env: &Env) -> (TokenContractClient<'_>, Address, Address) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let other = Address::generate(env);
    let id = env.register(TokenContract, (&admin, 1_000i128));
    (TokenContractClient::new(env, &id), admin, other)
}

#[test]
fn transfers_between_accounts() {
    let env = Env::default();
    let (client, admin, other) = setup(&env);
    client.transfer(&admin, &other, &400);
    assert_eq!(client.balance(&admin), 600);
    assert_eq!(client.balance(&other), 400);
    assert_eq!(client.total_supply(), 1_000);
}

#[test]
fn rejects_negative_amount_that_would_steal_funds() {
    let env = Env::default();
    let (client, admin, other) = setup(&env);
    let result = client.try_transfer(&other, &admin, &-500);
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
    assert_eq!(client.balance(&admin), 1_000);
}

#[test]
fn rejects_insufficient_balance() {
    let env = Env::default();
    let (client, admin, other) = setup(&env);
    assert_eq!(client.try_transfer(&other, &admin, &1), Err(Ok(Error::InsufficientBalance)));
}
