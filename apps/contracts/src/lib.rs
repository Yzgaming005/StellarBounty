#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env};

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum BountyStatus {
    Created,
    Funded,
    InProgress,
    UnderReview,
    Completed,
    Cancelled,
}

const OWNER: &str = "OWNER";
const AMOUNT: &str = "AMOUNT";
const STATUS: &str = "STATUS";
const CONTRIBUTOR: &str = "CONTRIB";

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize a bounty. Sets owner, amount, and status to Created.
    pub fn initialize(env: Env, owner: Address, amount: i128) {
        owner.require_auth();
        env.storage().instance().set(&symbol_short!(OWNER), &owner);
        env.storage().instance().set(&symbol_short!(AMOUNT), &amount);
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::Created);
    }

    /// Fund the bounty. Transitions Created → Funded.
    pub fn fund(env: Env, owner: Address) {
        owner.require_auth();
        Self::assert_owner(&env, &owner);
        Self::assert_status(&env, BountyStatus::Created, "fund requires Created status");
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::Funded);
    }

    /// Contributor starts work. Transitions Funded → InProgress.
    pub fn start_work(env: Env, contributor: Address) {
        contributor.require_auth();
        Self::assert_status(&env, BountyStatus::Funded, "start_work requires Funded status");
        env.storage().instance().set(&symbol_short!(CONTRIBUTOR), &contributor);
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::InProgress);
    }

    /// Contributor submits work. Transitions InProgress → UnderReview.
    pub fn submit(env: Env, contributor: Address) {
        contributor.require_auth();
        Self::assert_contributor(&env, &contributor);
        Self::assert_status(&env, BountyStatus::InProgress, "submit requires InProgress status");
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::UnderReview);
    }

    /// Owner approves and releases funds. Transitions UnderReview → Completed.
    pub fn approve(env: Env, owner: Address) {
        owner.require_auth();
        Self::assert_owner(&env, &owner);
        Self::assert_status(&env, BountyStatus::UnderReview, "approve requires UnderReview status");
        // Token transfer would be wired here via soroban token interface.
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::Completed);
    }

    /// Owner cancels. Only valid from Created or Funded; refunds owner.
    pub fn cancel(env: Env, owner: Address) {
        owner.require_auth();
        Self::assert_owner(&env, &owner);
        let status: BountyStatus = env.storage().instance().get(&symbol_short!(STATUS)).unwrap();
        assert!(
            status == BountyStatus::Created || status == BountyStatus::Funded,
            "cancel only allowed from Created or Funded"
        );
        // Refund logic would be wired here via soroban token interface.
        env.storage().instance().set(&symbol_short!(STATUS), &BountyStatus::Cancelled);
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!(OWNER)).unwrap()
    }

    pub fn get_amount(env: Env) -> i128 {
        env.storage().instance().get(&symbol_short!(AMOUNT)).unwrap()
    }

    pub fn get_status(env: Env) -> BountyStatus {
        env.storage().instance().get(&symbol_short!(STATUS)).unwrap()
    }

    pub fn get_contributor(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!(CONTRIBUTOR)).unwrap()
    }

    // --- helpers ---

    fn assert_owner(env: &Env, caller: &Address) {
        let owner: Address = env.storage().instance().get(&symbol_short!(OWNER)).unwrap();
        assert!(caller == &owner, "only owner can call this");
    }

    fn assert_contributor(env: &Env, caller: &Address) {
        let contributor: Address = env.storage().instance().get(&symbol_short!(CONTRIBUTOR)).unwrap();
        assert!(caller == &contributor, "only contributor can call this");
    }

    fn assert_status(env: &Env, expected: BountyStatus, msg: &str) {
        let status: BountyStatus = env.storage().instance().get(&symbol_short!(STATUS)).unwrap();
        assert!(status == expected, "{}", msg);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, EscrowContractClient<'static>, Address, i128) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EscrowContract, ());
        let client = EscrowContractClient::new(&env, &contract_id);
        let owner = Address::generate(&env);
        let amount: i128 = 1000;
        (env, client, owner, amount)
    }

    #[test]
    fn test_initialize_stores_owner_and_amount() {
        let (_, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        assert_eq!(client.get_owner(), owner);
        assert_eq!(client.get_amount(), amount);
        assert_eq!(client.get_status(), BountyStatus::Created);
    }

    #[test]
    fn test_fund_transitions_to_funded() {
        let (_, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        assert_eq!(client.get_status(), BountyStatus::Funded);
    }

    #[test]
    fn test_start_work_transitions_to_in_progress() {
        let (env, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        let contributor = Address::generate(&env);
        client.start_work(&contributor);
        assert_eq!(client.get_status(), BountyStatus::InProgress);
        assert_eq!(client.get_contributor(), contributor);
    }

    #[test]
    fn test_submit_transitions_to_under_review() {
        let (env, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        let contributor = Address::generate(&env);
        client.start_work(&contributor);
        client.submit(&contributor);
        assert_eq!(client.get_status(), BountyStatus::UnderReview);
    }

    #[test]
    fn test_approve_transitions_to_completed() {
        let (env, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        let contributor = Address::generate(&env);
        client.start_work(&contributor);
        client.submit(&contributor);
        client.approve(&owner);
        assert_eq!(client.get_status(), BountyStatus::Completed);
    }

    #[test]
    fn test_cancel_from_created() {
        let (_, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.cancel(&owner);
        assert_eq!(client.get_status(), BountyStatus::Cancelled);
    }

    #[test]
    fn test_cancel_from_funded() {
        let (_, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        client.cancel(&owner);
        assert_eq!(client.get_status(), BountyStatus::Cancelled);
    }

    #[test]
    #[should_panic(expected = "only owner can call this")]
    fn test_release_unauthorized_panics() {
        let (env, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        let not_owner = Address::generate(&env);
        client.approve(&not_owner);
    }

    #[test]
    #[should_panic(expected = "cancel only allowed from Created or Funded")]
    fn test_cancel_from_in_progress_panics() {
        let (env, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        let contributor = Address::generate(&env);
        client.start_work(&contributor);
        client.cancel(&owner);
    }

    #[test]
    #[should_panic(expected = "fund requires Created status")]
    fn test_invalid_transition_panics() {
        let (_, client, owner, amount) = setup();
        client.initialize(&owner, &amount);
        client.fund(&owner);
        // Funding again should panic
        client.fund(&owner);
    }
}
