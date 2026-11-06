use super::*;
use soroban_sdk::testutils::Address as _;

#[test]
fn increments_and_admin_resets() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(CounterContract, (&admin,));
    let client = CounterContractClient::new(&env, &id);

    assert_eq!(client.increment(), 1);
    assert_eq!(client.increment(), 2);
    assert_eq!(client.get(), 2);

    env.mock_all_auths();
    client.reset();
    // env.auths() solo guarda la última llamada: se revisa antes de volver a llamar.
    assert_eq!(env.auths()[0].0, admin);
    assert_eq!(client.get(), 0);
}

#[test]
#[should_panic]
fn reset_requires_admin_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(CounterContract, (&admin,));
    CounterContractClient::new(&env, &id).reset();
}
