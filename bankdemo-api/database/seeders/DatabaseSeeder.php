<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\ATM;
use App\Models\Notification;
use App\Models\Recipient;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Main demo user ───────────────────────────────────────
        $user = User::factory()->create([
            'name'     => 'Yassin',
            'email'    => 'yassin@bankdemo.com',
            'password' => bcrypt('password123'),
        ]);

        $account = Account::factory()->create([
            'user_id'        => $user->id,
            'account_number' => 'ACC00000001',
            'balance'        => 4872.50,
        ]);

        // ── Other users (transfer targets) ───────────────────────
        $alex = User::factory()->create([
            'name'     => 'Alex Martin',
            'email'    => 'alex.martin@email.com',
            'password' => bcrypt('password123'),
        ]);
        $alexAccount = Account::factory()->create([
            'user_id'        => $alex->id,
            'account_number' => 'ACC00000002',
            'balance'        => 3200.00,
        ]);

        $sara = User::factory()->create([
            'name'     => 'Sara Lopez',
            'email'    => 'sara.lopez@email.com',
            'password' => bcrypt('password123'),
        ]);
        $saraAccount = Account::factory()->create([
            'user_id'        => $sara->id,
            'account_number' => 'ACC00000003',
            'balance'        => 1500.00,
        ]);

        $marie = User::factory()->create([
            'name'     => 'Marie Dupont',
            'email'    => 'marie.dupont@email.com',
            'password' => bcrypt('password123'),
        ]);
        $marieAccount = Account::factory()->create([
            'user_id'        => $marie->id,
            'account_number' => 'ACC00000004',
            'balance'        => 2800.00,
        ]);

        // ── Saved recipients for Yassin ──────────────────────────
        Recipient::create(['user_id' => $user->id, 'name' => 'Alex Martin',   'account_number' => 'ACC00000002']);
        Recipient::create(['user_id' => $user->id, 'name' => 'Sara Lopez',    'account_number' => 'ACC00000003']);
        Recipient::create(['user_id' => $user->id, 'name' => 'Marie Dupont',  'account_number' => 'ACC00000004']);

        // ── Transactions for Yassin ──────────────────────────────
        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'deposit',
            'amount'               => 3500.00,
            'description'          => 'Salaire mensuel',
            'created_at'           => '2026-03-01 09:00:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'send',
            'amount'               => 150.00,
            'description'          => 'Remboursement dîner',
            'recipient_account_id' => $alexAccount->id,
            'created_at'           => '2026-03-02 14:30:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'send',
            'amount'               => 50.00,
            'description'          => 'Part loyer colocation',
            'recipient_account_id' => $saraAccount->id,
            'created_at'           => '2026-03-03 16:45:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'deposit',
            'amount'               => 800.00,
            'description'          => 'Projet freelance',
            'created_at'           => '2026-03-04 10:15:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'send',
            'amount'               => 85.30,
            'description'          => 'Courses Carrefour',
            'recipient_account_id' => $marieAccount->id,
            'created_at'           => '2026-03-05 11:00:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'deposit',
            'amount'               => 200.00,
            'description'          => 'Virement familial',
            'created_at'           => '2026-03-06 08:20:00',
        ]);

        Transaction::create([
            'account_id'           => $account->id,
            'type'                 => 'send',
            'amount'               => 42.70,
            'description'          => 'Abonnement Netflix',
            'recipient_account_id' => null,
            'created_at'           => '2026-03-06 20:00:00',
        ]);

        // ── ATMs (Lyon area, realistic) ─────────────────────────
        $atms = [
            ['name' => 'BNP Paribas – Bellecour',        'latitude' => 45.7578, 'longitude' => 4.8320, 'address' => '14 Place Bellecour, 69002 Lyon',          'services' => ['Retraits', 'Dépôts', 'Virements', 'Solde'], 'available_24h' => true],
            ['name' => 'Société Générale – Part-Dieu',    'latitude' => 45.7606, 'longitude' => 4.8590, 'address' => '17 Bd Vivier Merle, 69003 Lyon',          'services' => ['Retraits', 'Virements', 'Solde'],           'available_24h' => true],
            ['name' => 'Crédit Agricole – Confluence',    'latitude' => 45.7434, 'longitude' => 4.8185, 'address' => '112 Cours Charlemagne, 69002 Lyon',       'services' => ['Retraits', 'Dépôts', 'Solde'],              'available_24h' => false],
            ['name' => 'LCL – Presqu\'île',               'latitude' => 45.7640, 'longitude' => 4.8357, 'address' => '58 Rue de la République, 69002 Lyon',     'services' => ['Retraits', 'Solde'],                        'available_24h' => true],
            ['name' => 'HSBC – Vieux Lyon',               'latitude' => 45.7620, 'longitude' => 4.8266, 'address' => '3 Place Saint-Jean, 69005 Lyon',          'services' => ['Retraits', 'Dépôts', 'Virements', 'Chèques'], 'available_24h' => true],
            ['name' => 'CIC – Brotteaux',                 'latitude' => 45.7700, 'longitude' => 4.8530, 'address' => '97 Bd des Brotteaux, 69006 Lyon',         'services' => ['Retraits', 'Virements'],                    'available_24h' => false],
            ['name' => 'Banque Populaire – Guillotière',  'latitude' => 45.7530, 'longitude' => 4.8450, 'address' => '15 Cours Gambetta, 69007 Lyon',           'services' => ['Retraits', 'Dépôts', 'Solde'],              'available_24h' => true],
            ['name' => 'Caisse d\'Épargne – Terreaux',    'latitude' => 45.7676, 'longitude' => 4.8344, 'address' => '8 Place des Terreaux, 69001 Lyon',        'services' => ['Retraits', 'Dépôts', 'Virements'],         'available_24h' => false],
        ];

        foreach ($atms as $atm) {
            ATM::create($atm);
        }

        // ── Notifications for Yassin ─────────────────────────────
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'transaction',
            'title'      => 'Salaire reçu',
            'message'    => '€3 500,00 reçu — Salaire mensuel',
            'read'       => false,
            'created_at' => '2026-03-01 09:05:00',
        ]);
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'transaction',
            'title'      => 'Transfert envoyé',
            'message'    => '€150,00 envoyé à Alex Martin',
            'read'       => true,
            'created_at' => '2026-03-02 14:35:00',
        ]);
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'security',
            'title'      => 'Nouvelle connexion',
            'message'    => 'Connexion détectée depuis un nouvel appareil.',
            'read'       => true,
            'created_at' => '2026-03-03 08:00:00',
        ]);
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'transaction',
            'title'      => 'Projet freelance',
            'message'    => '€800,00 reçu — Projet freelance',
            'read'       => false,
            'created_at' => '2026-03-04 10:20:00',
        ]);
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'alert',
            'title'      => 'Dépense inhabituelle',
            'message'    => 'Un paiement de €85,30 a été détecté chez Carrefour.',
            'read'       => false,
            'created_at' => '2026-03-05 11:05:00',
        ]);
        Notification::create([
            'user_id'    => $user->id,
            'type'       => 'info',
            'title'      => 'Mise à jour disponible',
            'message'    => 'Une nouvelle version de BankDemo est disponible.',
            'read'       => true,
            'created_at' => '2026-03-06 12:00:00',
        ]);
    }
}

