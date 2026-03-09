<?php

namespace Tests\Feature;

use App\Models\ATM;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ATMTest extends TestCase
{
    use RefreshDatabase;

    public function test_nearby_returns_atms_sorted_by_distance(): void
    {
        $user = User::factory()->create();

        ATM::create(['name' => 'Far', 'latitude' => 49.0, 'longitude' => 2.5, 'address' => 'Far away']);
        ATM::create(['name' => 'Near', 'latitude' => 48.857, 'longitude' => 2.353, 'address' => 'Close']);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/atms/nearby?lat=48.8566&lng=2.3522&radius=50');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');

        // Near ATM should come first
        $data = $response->json('data');
        $this->assertEquals('Near', $data[0]['name']);
    }

    public function test_nearby_requires_lat_lng(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/atms/nearby');

        $response->assertStatus(422);
    }

    public function test_unauthenticated_cannot_access_atms(): void
    {
        $this->getJson('/api/atms/nearby?lat=48&lng=2')->assertStatus(401);
    }
}
