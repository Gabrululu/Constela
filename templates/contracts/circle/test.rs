use super::*;
use soroban_sdk::{testutils::Address as _, vec};

fn setup(env: &Env) -> (SavingsCircleClient<'_>, token::Client<'_>, Address, Address, Address) {
    env.mock_all_auths();
    let sac = env.register_stellar_asset_contract_v2(Address::generate(env));
    let admin = token::StellarAssetClient::new(env, &sac.address());
    let (ana, bea, caro) = (Address::generate(env), Address::generate(env), Address::generate(env));
    for member in [&ana, &bea, &caro] {
        admin.mint(member, &1_000);
    }
    let members = vec![env, ana.clone(), bea.clone(), caro.clone()];
    let id = env.register(SavingsCircle, (sac.address(), 100i128, members));
    (SavingsCircleClient::new(env, &id), token::Client::new(env, &sac.address()), ana, bea, caro)
}

#[test]
fn full_cycle_returns_everyone_their_money() {
    let env = Env::default();
    let (client, token, ana, bea, caro) = setup(&env);
    for expected in [&ana, &bea, &caro] {
        for member in [&ana, &bea, &caro] {
            client.contribute(member);
        }
        assert_eq!(&client.current_recipient(), expected);
        assert_eq!(&client.payout(), expected);
    }
    assert_eq!(token.balance(&ana), 1_000);
    assert_eq!(token.balance(&bea), 1_000);
    assert_eq!(token.balance(&caro), 1_000);
    assert_eq!(client.try_payout(), Err(Ok(Error::Finished)));
    assert_eq!(client.try_contribute(&ana), Err(Ok(Error::Finished)));
}

#[test]
fn payout_waits_for_every_member() {
    let env = Env::default();
    let (client, _, ana, _, _) = setup(&env);
    client.contribute(&ana);
    assert_eq!(client.try_payout(), Err(Ok(Error::RoundIncomplete)));
}

#[test]
fn rejects_double_contribution_and_outsiders() {
    let env = Env::default();
    let (client, _, ana, _, _) = setup(&env);
    client.contribute(&ana);
    assert_eq!(client.try_contribute(&ana), Err(Ok(Error::AlreadyPaid)));
    assert_eq!(client.try_contribute(&Address::generate(&env)), Err(Ok(Error::NotAMember)));
}

#[test]
#[should_panic]
fn rejects_duplicate_members() {
    let env = Env::default();
    env.mock_all_auths();
    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let ana = Address::generate(&env);
    let members = vec![&env, ana.clone(), ana];
    env.register(SavingsCircle, (sac.address(), 100i128, members));
}
