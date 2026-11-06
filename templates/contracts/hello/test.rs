use super::*;

#[test]
fn says_hello() {
    let env = Env::default();
    let id = env.register(HelloContract, ());
    let client = HelloContractClient::new(&env, &id);
    let out = client.hello(&String::from_str(&env, "Ana"));
    assert_eq!(out.len(), 2);
    assert_eq!(out.get_unchecked(1), String::from_str(&env, "Ana"));
}
