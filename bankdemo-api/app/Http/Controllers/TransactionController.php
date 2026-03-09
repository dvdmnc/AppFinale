<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepositRequest;
use App\Http\Requests\SendMoneyRequest;
use App\Models\Account;
use App\Models\Notification;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $account = $request->user()->account;

        if (!$account) {
            return response()->json(['data' => []]);
        }

        $transactions = Transaction::where('account_id', $account->id)
            ->orWhere('recipient_account_id', $account->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($tx) use ($account) {
                $data = $tx->toArray();
                // Mark whether this user is the sender or recipient
                $data['is_sender'] = $tx->account_id === $account->id;
                // Attach the other party's name for display
                if ($data['is_sender'] && $tx->recipient_account_id) {
                    $data['other_party'] = Account::find($tx->recipient_account_id)?->user?->name;
                } elseif (!$data['is_sender']) {
                    $data['other_party'] = Account::find($tx->account_id)?->user?->name;
                }
                return $data;
            });

        return response()->json(['data' => $transactions]);
    }

    public function send(SendMoneyRequest $request): JsonResponse
    {
        $senderAccount = $request->user()->account;
        $recipientAccount = Account::where('account_number', $request->recipient_account_number)->firstOrFail();

        // Cannot send to self
        if ($senderAccount->id === $recipientAccount->id) {
            return response()->json(['message' => 'Vous ne pouvez pas envoyer de l\'argent à votre propre compte'], 422);
        }

        // Insufficient balance
        if ($senderAccount->balance < $request->amount) {
            return response()->json(['message' => 'Solde insuffisant'], 422);
        }

        $transaction = DB::transaction(function () use ($senderAccount, $recipientAccount, $request) {
            $senderAccount->decrement('balance', $request->amount);
            $recipientAccount->increment('balance', $request->amount);

            return Transaction::create([
                'account_id'           => $senderAccount->id,
                'type'                 => 'send',
                'amount'               => $request->amount,
                'description'          => $request->description ?? '',
                'recipient_account_id' => $recipientAccount->id,
            ]);
        });

        Notification::create([
            'user_id' => $request->user()->id,
            'type'    => 'transaction',
            'title'   => 'Transfert envoyé',
            'message' => '€' . number_format($request->amount, 2) . ' envoyé à ' . $recipientAccount->user->name,
        ]);

        Notification::create([
            'user_id' => $recipientAccount->user->id,
            'type'    => 'transaction',
            'title'   => 'Transfert reçu',
            'message' => '€' . number_format($request->amount, 2) . ' reçu de ' . $request->user()->name,
        ]);

        return response()->json($transaction, 201);
    }

    public function deposit(DepositRequest $request): JsonResponse
    {
        $account = $request->user()->account;

        $transaction = DB::transaction(function () use ($account, $request) {
            $account->increment('balance', $request->amount);

            return Transaction::create([
                'account_id'  => $account->id,
                'type'        => 'deposit',
                'amount'      => $request->amount,
                'description' => $request->description ?? '',
            ]);
        });

        Notification::create([
            'user_id' => $request->user()->id,
            'type'    => 'transaction',
            'title'   => 'Dépôt reçu',
            'message' => '€' . number_format($request->amount, 2) . ' ajouté à votre compte',
        ]);

        return response()->json($transaction, 201);
    }
}
