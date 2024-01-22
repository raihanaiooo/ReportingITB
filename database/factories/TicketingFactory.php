<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Ticketing;
use App\Models\User; // Import the User model

class TicketingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Ticketing::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'requester_name' => $this->faker->name,
            'subject' => $this->faker->text,
            'assign' => $this->faker->randomElement(['administrator', 'Ami Nellasari', 'Ario Sutomo', 'Helpdesk DTI', 'Iwan Setiawan', 'Manager DTI', 'Mohammad Erwin Saputra', 'Ops1', 'Ops2', 'Ops3']),
            'createdDate' => $this->faker->date,
            'dueDate' => $this->faker->date,
            'status' => $this->faker->randomElement(['open', 'in progress', 'closed', 'resolved']),
            'site' => $this->faker->randomElement(['ITB', 'ITB Jatinangor', 'softwareone']),
            'priority' => $this->faker->randomElement(['High', 'Low', 'Normal', 'Urgent']),
            'group' => $this->faker->randomElement(['Helpdesk', '']),
        ];
    }
}
