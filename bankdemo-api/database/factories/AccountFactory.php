<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'account_number' => 'ACC' . fake()->unique()->numerify('########'),
            'balance' => fake()->randomFloat(2, 100, 10000),
        ];
    }
}
