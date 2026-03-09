<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'type' => fake()->randomElement(['send', 'deposit']),
            'amount' => fake()->randomFloat(2, 10, 500),
            'description' => fake()->sentence(3),
            'recipient_account_id' => null,
        ];
    }
}
