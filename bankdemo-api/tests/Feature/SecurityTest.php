<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Security tests — attack-case scenarios.
 * Tests rate limiting, validation edge cases, authorization boundaries.
 */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    // ── Rate Limiting ─────────────────────────────────────────

    public function test_login_is_rate_limited(): void
    {
        $payload = ['email' => 'test@test.com', 'password' => 'wrong'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', $payload);
        }

        // 6th request should be throttled
        $response = $this->postJson('/api/login', $payload);
        $response->assertStatus(429);
    }

    public function test_register_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/register', [
                'name' => "User$i",
                'email' => "user$i@test.com",
                'password' => 'Secret123!',
                'password_confirmation' => 'Secret123!',
            ]);
        }

        $response = $this->postJson('/api/register', [
            'name' => 'Final',
            'email' => 'final@test.com',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);
        $response->assertStatus(429);
    }

    public function test_send_money_is_rate_limited(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id, 'balance' => 100000]);
        $target = Account::factory()->create();

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($user, 'sanctum')
                 ->postJson('/api/transactions/send', [
                     'recipient_account_number' => $target->account_number,
                     'amount' => 1,
                     'description' => "tx-$i",
                 ]);
        }

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => $target->account_number,
                             'amount' => 1,
                             'description' => 'throttled',
                         ]);
        $response->assertStatus(429);
    }

    // ── Authorization (IDOR) ──────────────────────────────────

    public function test_user_cannot_access_other_users_account(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        Account::factory()->create(['user_id' => $user2->id, 'balance' => 9999]);

        // user1 can only see their own (null) account
        $response = $this->actingAs($user1, 'sanctum')->getJson('/api/account');
        // user1 has no account → 404
        $response->assertStatus(404);
    }

    // ── Input Validation Edge Cases ───────────────────────────

    public function test_send_rejects_negative_amount(): void
    {
        $user = User::factory()->create();
        Account::factory()->create(['user_id' => $user->id, 'balance' => 5000]);
        $target = Account::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => $target->account_number,
                             'amount' => -500,
                         ]);
        $response->assertStatus(422);
    }

    public function test_send_rejects_non_numeric_amount(): void
    {
        $user = User::factory()->create();
        Account::factory()->create(['user_id' => $user->id, 'balance' => 5000]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/transactions/send', [
                             'recipient_account_number' => 'ACC00000002',
                             'amount' => 'abc',
                         ]);
        $response->assertStatus(422);
    }

    public function test_register_rejects_weak_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Weak',
            'email' => 'weak@test.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_xss_payload_is_sanitized_in_description(): void
    {
        $user = User::factory()->create();
        $account = Account::factory()->create(['user_id' => $user->id, 'balance' => 5000]);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/transactions/deposit', [
                             'amount' => 100,
                             'description' => '<script>alert("xss")</script>',
                         ]);

        $response->assertStatus(201);
        // Laravel JSON responses are escaped by default
        $this->assertStringNotContainsString(
            '<script>',
            $response->getContent()
        );
    }
}
