<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = User::class;
    public function definition(): array
    {

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'phone' =>str_pad($this->faker->randomNumber(9), 12, '0', STR_PAD_LEFT),
            'mobile' =>str_pad($this->faker->randomNumber(9), 12, '0', STR_PAD_LEFT),
            'licenses' => $this->faker->randomElement(['basic', 'premium']),
            'web_type' => $this->faker->randomElement(['zoom','microsoft', 'adobe', 'mathlab', 'minitab']),
            'department' => $this->faker->randomElement(['FMIPA','STEI', 'FTI', 'FTMD', 'SAPPK']),
            'role' => 'User',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
