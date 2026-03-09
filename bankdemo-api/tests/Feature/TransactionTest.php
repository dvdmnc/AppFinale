<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Account & Transaction TDD tests — Red phase.
 * Covers: show account, list transactions, send money, deposit, authorization.
 */
class TransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'balance' => 5000.00,
        ]);
    }

    // ── Account ───────────────────────────────────────────────

    public function test_user_can_view_own_account(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/account');

        $response->assertStatus(200)
                 ->assertJson([
                     'account_number' => $this->account->account_number,
                     'balance' => '5000.00',
                 ]);
    }

    public function test_unauthenticated_cannot_view_account(): void
    {
        $this->getJson('/api/account')->assertStatus(401);
    }

    // ── List Transactions ─────────────────────────────────────

    public function test_user_can_list_transactions(): void
    {
        Transaction::factory()->count(3)->create(['account_id' => $this->account->id]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/transactions');

        $response->assertStatus(200)
                 ->assertJsonCount(3, 'data');
    }

    public function test_user_cannot_see_others_transactions(): void
    {
        $other = User::factory()->create();
        $otherAccount = Account::factory()->create(['user_id' => $other->id]);
        Transaction::factory()->create(['account_id' => $otherAccount->id]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/transactions');

        $response->assertStatus(200)
                 ->assertJsonCount(0, 'data');
    }

    // ── Send Money ────────────────────────────────────────────

    public function test_user_can_send_money(): void
    {
        $recipient = User::factory()->create();
        $recipientAccount = Account::factory()->create([
            'user_id' => $recipient->id,
            'balance' => 1000.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => $recipientAccount->account_number,
                             'amount' => 500.00,
                             'description' => 'Test transfer',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['type' => 'send', 'amount' => '500.00']);

        // Balances updated
        $this->assertEquals(4500.00, $this->account->fresh()->balance);
        $this->assertEquals(1500.00, $recipientAccount->fresh()->balance);
    }

    public function test_send_fails_with_insufficient_balance(): void
    {
        $recipient = User::factory()->create();
        $recipientAccount = Account::factory()->create(['user_id' => $recipient->id]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => $recipientAccount->account_number,
                             'amount' => 99999.00,
                             'description' => 'Too much',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonFragment(['message' => 'Insufficient balance']);
    }

    public function test_send_fails_to_own_account(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => $this->account->account_number,
                             'amount' => 100.00,
                             'description' => 'Self transfer',
                         ]);

        $response->assertStatus(422);
    }

    public function test_send_fails_with_invalid_recipient(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => 'NONEXISTENT',
                             'amount' => 100.00,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['recipient_account_number']);
    }

    // ── Deposit ───────────────────────────────────────────────

    public function test_user_can_deposit_money(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/deposit', [
                             'amount' => 250.00,
                             'description' => 'Salary',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['type' => 'deposit', 'amount' => '250.00']);

        $this->assertEquals(5250.00, $this->account->fresh()->balance);
    }

    public function test_deposit_fails_with_zero_amount(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/deposit', [
                             'amount' => 0,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['amount']);
    }

    public function test_deposit_fails_with_negative_amount(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/transactions/deposit', [
                             'amount' => -100,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['amount']);
    }
}
