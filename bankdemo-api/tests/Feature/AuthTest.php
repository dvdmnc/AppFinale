<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Auth TDD tests — written FIRST (Red phase).
 * Test register, login, logout, token lifecycle, and user endpoint.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Register ──────────────────────────────────────────────

    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@test.com',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'alice@test.com']);
        // Registration should auto-create an account
        $this->assertDatabaseHas('accounts', [
            'user_id' => $response->json('user.id'),
        ]);
    }

    public function test_register_fails_with_missing_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@test.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Bob',
            'email' => 'dup@test.com',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    // ── Login ─────────────────────────────────────────────────

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('Secret123!')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('Secret123!')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
                 ->assertJson(['message' => 'Invalid credentials']);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@test.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(401);
    }

    // ── Token / User ─────────────────────────────────────────

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/user');

        $response->assertStatus(200)
                 ->assertJson([
                     'id' => $user->id,
                     'name' => $user->name,
                     'email' => $user->email,
                 ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    // ── Logout ────────────────────────────────────────────────

    public function test_user_can_logout_and_token_is_revoked(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Logout
        $response = $this->withHeaders(['Authorization' => "Bearer $token"])
                         ->postJson('/api/logout');

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Logged out']);

        // Token should no longer work
        $this->getJson('/api/user', ['Authorization' => "Bearer $token"])
             ->assertStatus(401);
    }
}
