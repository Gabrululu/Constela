use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};

fn setup(env: &Env) -> (VaultContractClient<'_>, token::Client<'_>, Address) {
    env.mock_all_auths();
    let issuer = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let saver = Address::generate(env);
    token::StellarAssetClient::new(env, &sac.address()).mint(&saver, &1_000);
    let id = env.register(VaultContract, (sac.address(), 100u64));
    (VaultContractClient::new(env, &id), token::Client::new(env, &sac.address()), saver)
}

#[test]
fn locks_until_unlock_time() {
    let env = Env::default();
    let (client, token, saver) = setup(&env);
    client.deposit(&saver, &400);
    assert_eq!(token.balance(&saver), 600);
    assert_eq!(client.try_withdraw(&saver), Err(Ok(Error::StillLocked)));

    env.ledger().with_mut(|ledger| ledger.timestamp = 100);
    assert_eq!(client.withdraw(&saver), 400);
    assert_eq!(token.balance(&saver), 1_000);
    assert_eq!(client.try_withdraw(&saver), Err(Ok(Error::NothingToWithdraw)));
}

#[test]
fn rejects_non_positive_deposit() {
    let env = Env::default();
    let (client, _, saver) = setup(&env);
    assert_eq!(client.try_deposit(&saver, &0), Err(Ok(Error::InvalidAmount)));
}
