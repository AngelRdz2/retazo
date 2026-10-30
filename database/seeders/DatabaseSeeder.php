<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RuleTemplateSeeder::class);

        // Local demo accounts (password: "password").
        User::firstOrCreate(['email' => 'demo@retazo.test'], [
            'name' => 'Organizador Demo',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);
        User::firstOrCreate(['email' => 'anotador@retazo.test'], [
            'name' => 'Anotador Demo',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);

        $this->call(DemoTournamentSeeder::class);
    }
}
